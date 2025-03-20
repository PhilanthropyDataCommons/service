import {
	db,
	assertSourceExists,
	createBulkUploadTask,
	getLimitValues,
	loadBulkUploadTaskBundle,
} from '../database';
import {
	Permission,
	TaskStatus,
	isAuthContext,
	isWritableBulkUploadTask,
} from '../types';
import {
	FailedMiddlewareError,
	InputConflictError,
	InputValidationError,
	NotFoundError,
	UnprocessableEntityError,
} from '../errors';
import {
	extractCreatedByParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { addProcessBulkUploadJob } from '../jobQueue';
import { S3_UNPROCESSED_KEY_PREFIX } from '../s3Client';
import { authContextHasFunderPermission } from '../authorization';
import type { Request, Response } from 'express';

const postBulkUploadTask = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	if (!isWritableBulkUploadTask(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBulkUploadTask.errors ?? [],
		);
	}

	const { sourceId, funderShortCode, fileName, sourceKey } = req.body;
	const createdBy = req.user.keycloakUserId;

	if (!authContextHasFunderPermission(req, funderShortCode, Permission.EDIT)) {
		throw new UnprocessableEntityError(
			'You do not have write permissions on a funder with the specified short code.',
		);
	}

	if (!sourceKey.startsWith(`${S3_UNPROCESSED_KEY_PREFIX}/`)) {
		throw new InputValidationError(
			`sourceKey must be unprocessed, and begin with '${S3_UNPROCESSED_KEY_PREFIX}/'.`,
			[],
		);
	}

	await assertSourceExists(sourceId);
	try {
		const bulkUploadTask = await createBulkUploadTask(db, null, {
			sourceId,
			funderShortCode,
			fileName,
			sourceKey,
			status: TaskStatus.PENDING,
			createdBy,
		});
		await addProcessBulkUploadJob({
			bulkUploadId: bulkUploadTask.id,
		});
		res.status(201).contentType('application/json').send(bulkUploadTask);
	} catch (error: unknown) {
		if (error instanceof NotFoundError) {
			if (error.details.entityType === 'Source') {
				throw new InputConflictError(`The related entity does not exist`, {
					entityType: 'Source',
					entityId: sourceId,
				});
			}
		}
		throw error;
	}
};

const getBulkUploadTasks = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { createdBy } = extractCreatedByParameters(req);
	const bulkUploadTaskBundle = await loadBulkUploadTaskBundle(
		db,
		req,
		createdBy,
		limit,
		offset,
	);

	res.status(200).contentType('application/json').send(bulkUploadTaskBundle);
};

export const bulkUploadTasksHandlers = {
	postBulkUploadTask,
	getBulkUploadTasks,
};
