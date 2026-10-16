import { isNotEmpty } from '../arrays';
import { getDatabase } from '../database/db';
import {
	loadUserSyncTask,
	syncUsersFromKeycloak as syncUsersFromKeycloakOperation,
	updateUserSyncTask,
} from '../database';
import { TaskStatus, isSyncUsersFromKeycloakJobPayload } from '../types';
import type { JobHelpers, Logger as GraphileLogger } from 'graphile-worker';
import type { TinyPg } from 'tinypg';

/**
 * Processes a user sync task: replicates the realm's users from the Keycloak
 * Admin REST API into the local `users` cache using the credentials captured
 * when the task was requested, then records the summary on the task row.
 *
 * This task function must not throw: graphile-worker deletes the job row on
 * successful completion, which purges the caller's credentials from the
 * database, while a thrown failure would leave the row (with the payload)
 * in place. Failures are recorded on the task row instead. Each run first
 * reconciles task rows abandoned by crashed runs as failed, then purges job
 * rows that graphile-worker can never run again, bounding how long
 * credentials from a crashed run survive.
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
	const { userSyncTaskId, keycloakAdminAuthorizationHeader } = payload;
	try {
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
		const summary = await syncUsersFromKeycloakOperation(
			db,
			null,
			keycloakAdminAuthorizationHeader,
		);
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
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- A seen count of zero means the walk saw nobody.
		if (summary.users.seen === 0) {
			graphileLogger.warn(
				'The Keycloak user walk saw no users; users were not disabled this run',
				{ userSyncTaskId },
			);
		}
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
		} catch (failedUpdateError) {
			graphileLogger.error('Failed to mark the user sync task as FAILED', {
				failedUpdateError,
			});
		}
	}
};

/**
 * Removes sync job rows that graphile-worker will never run again, so their
 * payloads (which carry the requester's credentials) do not linger in the
 * jobs table. graphile-worker keeps permanently failed rows, and a row whose
 * worker crashed mid-run has attempts already at its maximum, so neither is
 * ever fetched again. Rows locked less than graphile's own stale lock window
 * (4 hours) may still be running and are left alone.
 */
const purgeUnrunnableUserSyncJobs = async (
	db: TinyPg,
	graphileLogger: GraphileLogger,
): Promise<void> => {
	try {
		await db.sql('userSyncTasks.purgeUnrunnableJobs');
	} catch (err) {
		graphileLogger.warn('Failed to purge unrunnable user sync jobs', { err });
	}
};

/**
 * Marks user sync task rows that were abandoned by crashed runs as failed,
 * so polling clients do not wait forever on a task whose job is gone or can
 * never run. The task row of the current run is excluded.
 */
const failAbandonedUserSyncTasks = async (
	db: TinyPg,
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
		graphileLogger.warn('Failed to mark abandoned user sync tasks as failed', {
			err,
		});
	}
};

export { failAbandonedUserSyncTasks, syncUsersFromKeycloak };
