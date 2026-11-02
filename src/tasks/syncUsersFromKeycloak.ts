import { getDatabase } from '../database/db';
import {
	createServiceQueryAuditLog,
	deleteManyByMissingId,
	insertOrUpdateMany,
	loadUserSyncTask,
	updateUserSyncTask,
} from '../database';
import { fetchKeycloakUsers } from '../keycloak';
import {
	isSyncUsersFromKeycloakJobPayload,
	nonNullKeycloakIdToString,
	TaskStatus,
} from '../types';
import type { JobHelpers } from 'graphile-worker';
import type { TinyPg } from 'tinypg';
import type { UserSyncSummary } from '../types';

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

const NO_USERS_COUNT = 0;

const syncRealmUsers = async (
	db: TinyPg,
	keycloakAdminAuthorizationHeader: string,
): Promise<UserSyncSummary> => {
	let seenUsersCount = NO_USERS_COUNT;
	const activeUsers: string[] = [];
	const skipDisabledAts: string[] = [];
	let lastReceivedAtIso: string | null = null;
	let added = 0;
	let updated = 0;
	let disabled = 0;
	for await (const { users: page, receivedAt } of fetchKeycloakUsers(
		keycloakAdminAuthorizationHeader,
	)) {
		const listedUsers = page.map(({ id, firstName, lastName, enabled }) => ({
			id,
			name: toFullName(firstName, lastName),
			enabled,
		}));
		const receivedAtIso = receivedAt.toISOString();
		lastReceivedAtIso = receivedAtIso;
		const mergeResult = await insertOrUpdateMany(
			db,
			listedUsers,
			receivedAtIso,
			receivedAtIso,
		);
		const { length: addedFromPage } = mergeResult.filter(
			(row) => row.wasInserted,
		);
		added += addedFromPage;
		updated += mergeResult.length - addedFromPage;
		disabled += listedUsers.filter((user) => !user.enabled).length;
		seenUsersCount += listedUsers.length;
		activeUsers.push(
			...listedUsers
				.filter((user) => user.enabled)
				.map((user) => nonNullKeycloakIdToString(user.id)),
		);
		skipDisabledAts.push(receivedAtIso);
	}
	if (seenUsersCount !== NO_USERS_COUNT) {
		const deleteResult = await deleteManyByMissingId(
			db,
			activeUsers,
			skipDisabledAts,
			lastReceivedAtIso,
		);
		disabled += deleteResult.length;
	}
	const summary: UserSyncSummary = {
		users: {
			seen: seenUsersCount,
			added,
			updated,
			disabled,
		},
	};
	await createServiceQueryAuditLog(db, null, {
		queryName: 'users.syncFromKeycloak',
		queryParameters: summary,
	});
	return summary;
};

const syncUsersFromKeycloak = async (
	payload: unknown,
	helpers: JobHelpers,
): Promise<void> => {
	const { logger: graphileLogger } = helpers;
	const db = getDatabase();
	if (!isSyncUsersFromKeycloakJobPayload(payload)) {
		graphileLogger.error('Malformed user sync job payload', {
			errors: isSyncUsersFromKeycloakJobPayload.errors ?? [],
		});
		return;
	}
	const { userSyncTaskId, keycloakAdminAuthorizationHeader } = payload;
	try {
		const userSyncTask = await loadUserSyncTask(db, null, userSyncTaskId);
		if (userSyncTask.status !== TaskStatus.PENDING) {
			graphileLogger.warn(
				'User sync task cannot be processed because it is not in a PENDING state',
				{ userSyncTaskId, status: userSyncTask.status },
			);
			return;
		}
		await updateUserSyncTask(
			db,
			null,
			{
				status: TaskStatus.IN_PROGRESS,
				statusUpdatedAt: new Date().toISOString(),
			},
			userSyncTaskId,
		);
		const summary = await syncRealmUsers(db, keycloakAdminAuthorizationHeader);
		if (summary.users.seen === NO_USERS_COUNT) {
			graphileLogger.warn(
				'The Keycloak user listing was empty; users were not disabled this run',
				{ userSyncTaskId },
			);
		}
		await updateUserSyncTask(
			db,
			null,
			{
				status: TaskStatus.COMPLETED,
				details: summary,
				statusUpdatedAt: new Date().toISOString(),
			},
			userSyncTaskId,
		);
	} catch (err) {
		graphileLogger.warn('Syncing users from Keycloak failed', { err });
		try {
			await updateUserSyncTask(
				db,
				null,
				{
					status: TaskStatus.FAILED,
					statusUpdatedAt: new Date().toISOString(),
				},
				userSyncTaskId,
			);
		} catch (updateError) {
			graphileLogger.warn(
				'Failed to mark the user sync task as failed; the job error is retained by graphile-worker',
				{ err: updateError },
			);
		}
	}
};

export { syncUsersFromKeycloak };
