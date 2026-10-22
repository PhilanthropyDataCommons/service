import { isNotEmpty } from '../arrays';
import { getDatabase } from '../database/db';
import { loadUserSyncTask, updateUserSyncTask } from '../database';
import {
	isSyncUsersFromKeycloakJobPayload,
	isTinyPgErrorWithQueryContext,
	TaskStatus,
} from '../types';
import type { JobHelpers, Logger as GraphileLogger } from 'graphile-worker';
import type { TinyPg } from 'tinypg';

/**
 * Processes a user sync task. This initial implementation is a hello
 * world run: it validates the job payload, performs the task lifecycle
 * maintenance, and walks a pending task through completion without yet
 * contacting the Keycloak Admin REST API. The requester's credentials
 * ride along in the job payload for the sync implementation that follows.
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
	await purgeUnrunnableUserSyncJobs(db, graphileLogger);
	await failAbandonedUserSyncTasks(db, userSyncTaskId, graphileLogger);
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

/**
 * Purges sync job rows graphile-worker can never run again so their
 * credential payloads do not linger; rows inside graphile's stale-lock
 * window may still be running and are left alone. Database failures are
 * tolerated; anything else propagates.
 */
const purgeUnrunnableUserSyncJobs = async (
	db: Pick<TinyPg, 'sql'>,
	graphileLogger: GraphileLogger,
): Promise<void> => {
	try {
		await db.sql('userSyncTasks.purgeUnrunnableJobs');
	} catch (err) {
		if (!isTinyPgErrorWithQueryContext(err)) {
			throw err;
		}
		graphileLogger.warn('Failed to purge unrunnable user sync jobs', { err });
	}
};

/**
 * Fails task rows abandoned by crashed runs so polling clients do not wait
 * forever; the current run's row is excluded. Database failures are
 * tolerated; anything else propagates.
 */
const failAbandonedUserSyncTasks = async (
	db: Pick<TinyPg, 'sql'>,
	userSyncTaskId: number,
	graphileLogger: GraphileLogger,
): Promise<void> => {
	try {
		const { rows: abandonedRows } = await db.sql<{ id: number }>(
			'userSyncTasks.failAbandoned',
			{ userSyncTaskId },
		);
		if (isNotEmpty(abandonedRows)) {
			graphileLogger.warn('Marked abandoned user sync tasks as failed', {
				userSyncTaskIds: abandonedRows.map((row) => row.id),
			});
		}
	} catch (err) {
		if (!isTinyPgErrorWithQueryContext(err)) {
			throw err;
		}
		graphileLogger.warn('Failed to mark abandoned user sync tasks as failed', {
			err,
		});
	}
};

export { failAbandonedUserSyncTasks, syncUsersFromKeycloak };
