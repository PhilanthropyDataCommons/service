import { Logger, quickAddJob, run, runMigrations } from 'graphile-worker';
import { copyBaseFields, processBulkUploadTask } from './tasks';
import { getLogger } from './logger';
import { db } from './database/db';
import type {
	CopyBaseFieldsJobPayload,
	ProcessBulkUploadJobPayload,
} from './types';

const logger = getLogger(__filename);

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

export const startJobQueue = async () => {
	const runner = await run({
		logger: jobQueueLogger,
		pgPool: db.pool,
		concurrency: 5,
		noHandleSignals: false,
		pollInterval: 1000,
		taskList: {
			processBulkUploadTask,
			copyBaseFields,
		},
	});
	runner.promise.catch((err) => {
		logger.error(err, 'The queue worker failed.');
	});
};

export const runJobQueueMigrations = async () =>
	runMigrations({
		logger: jobQueueLogger,
		pgPool: db.pool,
	});

export const addJob = async (jobType: JobType, payload: unknown) =>
	quickAddJob(
		{
			logger: jobQueueLogger,
			pgPool: db.pool,
		},
		jobType,
		payload,
	);

export const addProcessBulkUploadJob = async (
	payload: ProcessBulkUploadJobPayload,
) => addJob(JobType.PROCESS_BULK_UPLOAD, payload);

export const addCopyBaseFieldsJob = async (payload: CopyBaseFieldsJobPayload) =>
	addJob(JobType.COPY_BASE_FIELDS, payload);
