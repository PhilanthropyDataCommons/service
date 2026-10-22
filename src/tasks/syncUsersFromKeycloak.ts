import { isNotEmpty } from '../arrays';
import { getDatabase } from '../database/db';
import {
	loadUserSyncTask,
	syncUsersFromKeycloak as syncUsersFromKeycloakOperation,
	updateUserSyncTask,
} from '../database';
import {
	ForbiddenError,
	InputConflictError,
	InternalValidationError,
	KeycloakAdminApiError,
	UnauthorizedError,
} from '../errors';
import {
	isTinyPgErrorWithQueryContext,
	TaskStatus,
	isSyncUsersFromKeycloakJobPayload,
} from '../types';
import type { JobHelpers, Logger as GraphileLogger } from 'graphile-worker';
import type { TinyPg } from 'tinypg';

const isKnownRecoverableSyncError = (err: unknown): boolean =>
	err instanceof InputConflictError ||
	err instanceof KeycloakAdminApiError ||
	err instanceof UnauthorizedError ||
	err instanceof ForbiddenError ||
	err instanceof InternalValidationError;

/**
 * Processes a user sync task: lists the realm's users from the Keycloak
 * Admin REST API with the credentials captured when the task was requested,
 * then records the summary on the task row.
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
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- zero seen users contradicts the requester's valid token.
		if (summary.users.seen === 0) {
			graphileLogger.warn(
				'The Keycloak user listing was empty; users were not disabled this run',
				{ userSyncTaskId },
			);
		}
	} catch (err) {
		if (isKnownRecoverableSyncError(err)) {
			graphileLogger.warn('Syncing users from Keycloak failed', { err });
			await updateUserSyncTask(
				db,
				null,
				{
					status: TaskStatus.FAILED,
					statusUpdatedAt: new Date().toISOString(),
				},
				userSyncTaskId,
			);
		} else {
			throw err;
		}
	}
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
