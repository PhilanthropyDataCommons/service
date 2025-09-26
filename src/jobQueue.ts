import { Logger, quickAddJob, run, runMigrations } from 'graphile-worker';
import { TEN_MINUTES_IN_MS } from './constants/time';
import { copyBaseFields, processBulkUploadTask } from './tasks';
import { getLogger } from './logger';
import { db } from './database/db';
import type { Job } from 'graphile-worker';
import type {
	CopyBaseFieldsJobPayload,
	ProcessBulkUploadJobPayload,
} from './types';

const logger = getLogger(__filename);

const CONCURRENT_JOB_COUNT = 5;

enum JobType {
	PROCESS_BULK_UPLOAD = 'processBulkUploadTask',
	COPY_BASE_FIELDS = 'copyBaseFields',
}

export const jobQueueLogger = new Logger((scope) => (level, message, meta) => {
	switch (level.valueOf()) {
		case 'error':
			logger.error({ ...meta, scope }, message);
			break;
		case 'warn':
			logger.warn({ ...meta, scope }, message);
			break;
		case 'info':
			logger.info({ ...meta, scope }, message);
			break;
		case 'debug':
			logger.debug({ ...meta, scope }, message);
			break;
		default:
			logger.info({ ...meta, scope }, message);
	}
});

export const startJobQueue = async (): Promise<void> => {
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
		},
	});
	runner.promise.catch((err: unknown) => {
		logger.error(err, 'The queue worker failed.');
	});
};

export const runJobQueueMigrations = async (): Promise<void> => {
	await runMigrations({
		logger: jobQueueLogger,
		pgPool: db.pool,
	});
};

export const addJob = async (
	jobType: JobType,
	payload: unknown,
): Promise<Job> =>
	await quickAddJob(
		{
			logger: jobQueueLogger,
			pgPool: db.pool,
		},
		jobType,
		payload,
	);

export const addProcessBulkUploadJob = async (
	payload: ProcessBulkUploadJobPayload,
): Promise<Job> => await addJob(JobType.PROCESS_BULK_UPLOAD, payload);

export const addCopyBaseFieldsJob = async (
	payload: CopyBaseFieldsJobPayload,
): Promise<Job> => await addJob(JobType.COPY_BASE_FIELDS, payload);
