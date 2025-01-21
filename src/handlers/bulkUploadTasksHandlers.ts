import {
	db,
	assertSourceExists,
	createBulkUploadTask,
	getLimitValues,
	loadBulkUploadTaskBundle,
} from '../database';
import {
	TaskStatus,
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableBulkUploadTask,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputConflictError,
	InputValidationError,
	NotFoundError,
} from '../errors';
import {
	extractCreatedByParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { addProcessBulkUploadJob } from '../jobQueue';
import { S3_UNPROCESSED_KEY_PREFIX } from '../s3Client';
import type { Request, Response, NextFunction } from 'express';

const postBulkUploadTask = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	if (!isWritableBulkUploadTask(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableBulkUploadTask.errors ?? [],
			),
		);
		return;
	}

	const { sourceId, fileName, sourceKey } = req.body;
	const createdBy = req.user.keycloakUserId;

	if (!sourceKey.startsWith(`${S3_UNPROCESSED_KEY_PREFIX}/`)) {
		throw new InputValidationError(
			`sourceKey must be unprocessed, and begin with '${S3_UNPROCESSED_KEY_PREFIX}/'.`,
			[],
		);
	}

	assertSourceExists(sourceId)
		.then(async () => {
			const bulkUploadTask = await createBulkUploadTask(db, null, {
				sourceId,
				fileName,
				sourceKey,
				status: TaskStatus.PENDING,
				createdBy,
			});
			await addProcessBulkUploadJob({
				bulkUploadId: bulkUploadTask.id,
			});
			res.status(201).contentType('application/json').send(bulkUploadTask);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating bulk upload task.', error));
				return;
			}
			if (error instanceof NotFoundError) {
				if (error.details.entityType === 'Source') {
					next(
						new InputConflictError(`The related entity does not exist`, {
							entityType: 'Source',
							entityId: sourceId,
						}),
					);
					return;
				}
			}
			next(error);
		});
};

const getBulkUploadTasks = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { createdBy } = extractCreatedByParameters(req);
	(async () => {
		const bulkUploadTaskBundle = await loadBulkUploadTaskBundle(
			db,
			req,
			createdBy,
			limit,
			offset,
		);

		res.status(200).contentType('application/json').send(bulkUploadTaskBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving bulk upload tasks.', error));
			return;
		}
		next(error);
	});
};

export const bulkUploadTasksHandlers = {
	postBulkUploadTask,
	getBulkUploadTasks,
};
