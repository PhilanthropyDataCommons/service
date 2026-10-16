import { isEmpty } from '../../../arrays';
import { listKeycloakUsers } from '../../../keycloak';
import { InputConflictError } from '../../../errors';
import { createServiceQueryAuditLog } from '../serviceQueryAuditLogs';
import { keycloakIdToString } from '../../../types';
import type { AuthIdentityAndRole, UserSyncSummary } from '../../../types';
import type { TinyPg } from 'tinypg';

interface MergeFromSyncResultRow {
	wasInserted: boolean;
}

interface MarkNotLiveUsersDisabledResultRow {
	keycloak_user_id: string;
}

interface LockAcquiredResultRow {
	lockAcquired: boolean;
}

/**
 * Builds the user's full name (the OIDC `name` claim, first name then last
 * name) from the parts of a Keycloak user representation. The Keycloak
 * username is deliberately not used: with email-as-username realms it is an
 * email address, and the users cache stores the full name.
 */
const toFullName = (
	firstName: string | null | undefined,
	lastName: string | null | undefined,
): string | null => {
	const fullName = [firstName, lastName]
		.filter(
			(namePart) =>
				namePart !== null && namePart !== undefined && namePart !== '',
		)
		.join(' ');
	return fullName === '' ? null : fullName;
};

/**
 * Performs a full replication of Keycloak's users into the local `users`
 * cache using the provided authorization header (the caller's own
 * credentials are passed through to the Keycloak Admin REST API).
 *
 * Rows are merged with row-level `synced_from_keycloak_at` tracking, and
 * rows that Keycloak reports as absent or not enabled are marked
 * disabled (`disabled_at`) rather than deleted so that foreign keys and
 * audit history stay intact.
 */
const syncUsersFromKeycloak = async (
	db: TinyPg,
	authContext: AuthIdentityAndRole | null,
	keycloakAdminAuthorizationHeader: string,
): Promise<UserSyncSummary> =>
	await db.transaction(async (transactionDb) => {
		// Serialize sync runs: two overlapping runs could otherwise flip a
		// user's disabled_at against each other's (differently aged) snapshots.
		// The lock is held across the walk as well, so a slower walk cannot
		// apply an older snapshot after a newer run has committed.
		const {
			rows: [lockRow],
		} = await transactionDb.query<LockAcquiredResultRow>(
			`SELECT pg_try_advisory_xact_lock(hashtext('user_sync_tasks')) AS "lockAcquired"`,
		);
		if (lockRow?.lockAcquired !== true) {
			throw new InputConflictError(
				'Another user sync is already in progress.',
				{
					entityType: 'UserSyncTask',
				},
			);
		}
		const keycloakUsers = await listKeycloakUsers(
			keycloakAdminAuthorizationHeader,
		);
		// Keycloak walks with offset pagination: a user created between page
		// fetches can appear on two pages; deduplicate by id or the MERGE below
		// fails with "cannot affect row a second time". A user deleted between
		// page fetches is instead missed; that false disable self-heals at the
		// next sync.
		const usersById = new Map(
			keycloakUsers.map((keycloakUser) => [
				keycloakIdToString(keycloakUser.id),
				keycloakUser,
			]),
		);
		const distinctUsers = [...usersById.values()];
		// The array must be serialized as a JSON string ourselves: node-pg would
		// otherwise bind a JS array as a PostgreSQL array literal, which is not
		// valid jsonb input for the MERGE/UPDATE queries below.
		const users = JSON.stringify(
			distinctUsers.map(({ id, firstName, lastName, enabled }) => ({
				id,
				name: toFullName(firstName, lastName),
				enabled,
			})),
		);
		const mergeResult = await transactionDb.sql<MergeFromSyncResultRow>(
			'users.mergeFromSync',
			{ users },
		);
		const { length: added } = mergeResult.rows.filter((row) => row.wasInserted);
		// An empty walk contradicts the run itself: the requester's own valid
		// token proves at least one Keycloak user exists. Refuse to disable
		// everyone on a walk that saw nobody.
		const shouldDisableAbsentUsers = !isEmpty(distinctUsers);
		const markNotLiveUsersDisabledRows = shouldDisableAbsentUsers
			? (
					await transactionDb.sql<MarkNotLiveUsersDisabledResultRow>(
						'users.markNotLiveUsersDisabled',
						{ users },
					)
				).rows
			: [];
		const summary: UserSyncSummary = {
			users: {
				seen: distinctUsers.length,
				added,
				updated: distinctUsers.length - added,
				disabled: markNotLiveUsersDisabledRows.length,
			},
		};
		await createServiceQueryAuditLog(transactionDb, authContext, {
			queryName: 'users.syncFromKeycloak',
			// Deliberately excludes the authorization header; the audit log
			// must never contain credentials.
			queryParameters: summary,
		});
		return summary;
	});

export { syncUsersFromKeycloak };
