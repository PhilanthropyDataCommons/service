import {
	createBulkUpload,
	getLimitValues,
	loadBulkUploadBundle,
} from '../database';
import {
	AuthenticatedRequest,
	BulkUploadStatus,
	isTinyPgErrorWithQueryContext,
	isWritableBulkUpload,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { addProcessBulkUploadJob } from '../jobQueue';
import { S3_UNPROCESSED_KEY_PREFIX } from '../s3Client';
import type { Request, Response, NextFunction } from 'express';

const postBulkUpload = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	if (req.user === undefined) {
		next(new FailedMiddlewareError('Unexpected lack of user context.'));
		return;
	}
	if (!isWritableBulkUpload(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableBulkUpload.errors ?? [],
			),
		);
		return;
	}

	const { fileName, sourceKey } = req.body;
	const createdBy = req.user.id;

	if (!sourceKey.startsWith(`${S3_UNPROCESSED_KEY_PREFIX}/`)) {
		throw new InputValidationError(
			`sourceKey must be unprocessed, and begin with '${S3_UNPROCESSED_KEY_PREFIX}/'.`,
			[],
		);
	}

	(async () => {
		const bulkUpload = await createBulkUpload({
			fileName,
			sourceKey,
			status: BulkUploadStatus.PENDING,
			createdBy,
		});
		await addProcessBulkUploadJob({
			bulkUploadId: bulkUpload.id,
		});
		res.status(201).contentType('application/json').send(bulkUpload);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating bulk upload.', error));
			return;
		}
		next(error);
	});
};

const getBulkUploads = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	(async () => {
		const bulkUploadBundle = await loadBulkUploadBundle({
			...getLimitValues(paginationParameters),
		});

		res.status(200).contentType('application/json').send(bulkUploadBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving bulk uploads.', error));
			return;
		}
		next(error);
	});
};

export const bulkUploadsHandlers = {
	postBulkUpload,
	getBulkUploads,
};
