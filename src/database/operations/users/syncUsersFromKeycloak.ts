import { isEmpty } from '../../../arrays';
import { fetchKeycloakUsers } from '../../../keycloak';
import { InputConflictError } from '../../../errors';
import { createServiceQueryAuditLog } from '../serviceQueryAuditLogs';
import { keycloakIdToString } from '../../../types';
import type { AuthIdentityAndRole, UserSyncSummary } from '../../../types';
import type { TinyPg } from 'tinypg';

interface MergeFromSyncResultRow {
	wasInserted: boolean;
}

interface UpdateDisabledUsersResultRow {
	keycloak_user_id: string;
}

interface LockAcquiredResultRow {
	lockAcquired: boolean;
}

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
 * Replicates Keycloak's users into the local `users` cache with the
 * provided credentials (the caller's own, passed through to the Keycloak
 * Admin REST API). Users Keycloak reports as absent or disabled are marked
 * with `disabled_at` rather than deleted, keeping foreign keys and audit
 * history intact.
 *
 * Pitfalls and how they are avoided:
 * - Stale observations overwriting newer ones: an advisory lock is taken
 *   before any reads and held until commit.
 * - Offset pagination repeating a user across pages: the listing is
 *   deduplicated by id (keycloakUsersById).
 * - node-pg binding a JS array as a PostgreSQL array literal: the payload
 *   is serialized to JSON (usersJson).
 * - An empty listing disabling every cached user: a valid requester token
 *   proves at least one user exists, so an empty listing disables nobody.
 * - Credentials in the audit log: the audit records the summary only.
 */
const syncUsersFromKeycloak = async (
	db: TinyPg,
	authContext: AuthIdentityAndRole | null,
	keycloakAdminAuthorizationHeader: string,
): Promise<UserSyncSummary> =>
	await db.transaction(async (transactionDb) => {
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
		const keycloakUsers = await fetchKeycloakUsers(
			keycloakAdminAuthorizationHeader,
		);
		const keycloakUsersById = new Map(
			keycloakUsers.map((keycloakUser) => [
				keycloakIdToString(keycloakUser.id),
				keycloakUser,
			]),
		);
		const distinctUsers = [...keycloakUsersById.values()];
		const usersJson = JSON.stringify(
			distinctUsers.map(({ id, firstName, lastName, enabled }) => ({
				id,
				name: toFullName(firstName, lastName),
				enabled,
			})),
		);
		const mergeResult = await transactionDb.sql<MergeFromSyncResultRow>(
			'users.mergeFromSync',
			{ users: usersJson },
		);
		const { length: added } = mergeResult.rows.filter((row) => row.wasInserted);
		const shouldDisableAbsentUsers = !isEmpty(distinctUsers);
		const disabledRows = shouldDisableAbsentUsers
			? (
					await transactionDb.sql<UpdateDisabledUsersResultRow>(
						'users.updateDisabledUsers',
						{ users: usersJson },
					)
				).rows
			: [];
		const summary: UserSyncSummary = {
			users: {
				seen: distinctUsers.length,
				added,
				updated: distinctUsers.length - added,
				disabled: disabledRows.length,
			},
		};
		await createServiceQueryAuditLog(transactionDb, authContext, {
			queryName: 'users.syncFromKeycloak',
			queryParameters: summary,
		});
		return summary;
	});

export { syncUsersFromKeycloak };
