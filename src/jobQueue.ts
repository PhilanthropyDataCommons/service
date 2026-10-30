import { Logger, addJobAdhoc, run, runMigrations } from 'graphile-worker';
import { TinyPgError } from 'tinypg';
import { TEN_MINUTES_IN_MS } from './constants/time';
import {
	copyBaseFields,
	processBulkUploadTask,
	syncUsersFromKeycloak,
} from './tasks';
import { getLogger } from './logger';
import { getDatabase } from './database/db';
import { isTinyPgErrorWithQueryContext } from './types';
import type { TinyPg } from 'tinypg';
import type { Job } from 'graphile-worker';
import type {
	CopyBaseFieldsJobPayload,
	Id,
	ProcessBulkUploadJobPayload,
	SyncUsersFromKeycloakJobPayload,
} from './types';

const logger = getLogger(__filename);

const CONCURRENT_JOB_COUNT = 5;

const SYNC_USERS_FROM_KEYCLOAK_QUEUE_NAME = 'sync_users_from_keycloak';

enum JobType {
	PROCESS_BULK_UPLOAD = 'processBulkUploadTask',
	COPY_BASE_FIELDS = 'copyBaseFields',
	SYNC_USERS_FROM_KEYCLOAK = 'syncUsersFromKeycloak',
}

type LogMeta = Record<string, unknown>;

/**
 * graphile-worker logs job payloads on failure, and the sync payload
 * carries credentials.
 */
export const redactJobPayloadFromMeta = (meta: LogMeta): LogMeta => {
	const { job } = meta;
	return typeof job === 'object' && job !== null
		? { ...meta, job: { ...job, payload: '[REDACTED]' } }
		: meta;
};

export const jobQueueLogger = new Logger((scope) => (level, message, meta) => {
	const redactedMeta = redactJobPayloadFromMeta(meta);
	switch (level.valueOf()) {
		case 'error':
			logger.error({ ...redactedMeta, scope }, message);
			break;
		case 'warn':
			logger.warn({ ...redactedMeta, scope }, message);
			break;
		case 'info':
			logger.info({ ...redactedMeta, scope }, message);
			break;
		case 'debug':
			logger.debug({ ...redactedMeta, scope }, message);
			break;
		default:
			logger.info({ ...redactedMeta, scope }, message);
	}
});

export const startJobQueue = async (): Promise<void> => {
	const db = getDatabase();
	const runner = await run({
		logger: jobQueueLogger,
		pgPool: db.pool,
		concurrency: CONCURRENT_JOB_COUNT,
		noHandleSignals: false,
		/*
		 * The poll interval is for scheduled (not on-demand) jobs combined with idle workers. See
		 * https://worker.graphile.org/docs/faq#if-we-have-jobs-that-are-scheduled-in-the-futurefailed-will-workers-continuously-poll-to-run-those-jobs-or-will-the-listennotify-mechanism-be-used-for-that
		 * Every poll interval times the number of workers, a SQL update statement runs.
		 * If the need arises for frequent scheduled jobs, update this value appropriately.
		 */
		pollInterval: TEN_MINUTES_IN_MS,
		taskList: {
			processBulkUploadTask,
			copyBaseFields,
			syncUsersFromKeycloak,
		},
	});
	runner.promise.catch((err: unknown) => {
		logger.error(err, 'The queue worker failed.');
	});
};

export const runJobQueueMigrations = async (db: TinyPg): Promise<void> => {
	await runMigrations({
		logger: jobQueueLogger,
		pgPool: db.pool,
	});
};

export const addJob = async (
	jobType: JobType,
	payload: unknown,
): Promise<Job> => {
	const db = getDatabase();
	return await addJobAdhoc(
		{
			logger: jobQueueLogger,
			pgPool: db.pool,
		},
		jobType,
		payload,
	);
};

export const addProcessBulkUploadJob = async (
	payload: ProcessBulkUploadJobPayload,
): Promise<Job> => await addJob(JobType.PROCESS_BULK_UPLOAD, payload);

export const addCopyBaseFieldsJob = async (
	payload: CopyBaseFieldsJobPayload,
): Promise<Job> => await addJob(JobType.COPY_BASE_FIELDS, payload);

// Single attempt: a retry would replay a stale credential. Runs in the
// task row's transaction, so a task row is never visible without its job.
export const enqueueSyncUsersFromKeycloakJob = async (
	transactionDb: Pick<TinyPg, 'sql'>,
	userSyncTaskId: Id,
	keycloakAdminAuthorizationHeader: string,
): Promise<void> => {
	await transactionDb
		.sql('userSyncTasks.enqueueJob', {
			identifier: JobType.SYNC_USERS_FROM_KEYCLOAK,
			payload: JSON.stringify({
				userSyncTaskId,
				keycloakAdminAuthorizationHeader,
			} satisfies SyncUsersFromKeycloakJobPayload),
			queueName: SYNC_USERS_FROM_KEYCLOAK_QUEUE_NAME,
			maxAttempts: 1,
		})
		.catch((err: unknown) => {
			if (isTinyPgErrorWithQueryContext(err)) {
				// The bind parameters carry credentials; throw a redacted copy so the
				// error handler's logs never receive them.
				throw new TinyPgError(err.message, undefined, {
					error: err.queryContext.error,
					params: {
						identifier: 'syncUsersFromKeycloak',
						payload: '[REDACTED: the payload carries the caller credentials]',
						queueName: SYNC_USERS_FROM_KEYCLOAK_QUEUE_NAME,
						maxAttempts: 1,
					},
				});
			}
			throw err;
		});
};
