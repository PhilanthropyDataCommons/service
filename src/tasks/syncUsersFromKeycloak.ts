import { getDatabase } from '../database/db';
import { loadUserSyncTask, updateUserSyncTask } from '../database';
import { isSyncUsersFromKeycloakJobPayload, TaskStatus } from '../types';
import type { JobHelpers } from 'graphile-worker';

/**
 * Processes a user sync task. This initial implementation is a hello
 * world run: it validates the job payload and walks a pending task
 * through completion without yet contacting the Keycloak Admin REST
 * API. The requester's credentials ride along in the job payload for
 * the sync implementation that follows.
 */
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
	const { userSyncTaskId } = payload;
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
	// The real sync lands in a follow-up commit; completing the task here
	// proves the enqueue, polling, and lifecycle plumbing end to end.
	await updateUserSyncTask(
		db,
		null,
		{
			status: TaskStatus.COMPLETED,
			statusUpdatedAt: new Date().toISOString(),
		},
		userSyncTaskId,
	);
};

export { syncUsersFromKeycloak };
