import { Logger, quickAddJob, run, runMigrations } from 'graphile-worker';
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
const POLL_INTERVAL_MS = 1000;

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
		pollInterval: POLL_INTERVAL_MS,
		taskList: {
			processBulkUploadTask,
			copyBaseFields,
		},
	});
	runner.promise.catch((err) => {
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
