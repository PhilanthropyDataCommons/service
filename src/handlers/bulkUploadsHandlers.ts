import { S3_UNPROCESSED_KEY_PREFIX } from '../s3Client';
import { db, getLimitValues, loadBulkUploadBundle } from '../database';
import {
	isTinyPgErrorWithQueryContext,
	isBulkUploadCreate,
	BulkUploadStatus,
} from '../types';
import { DatabaseError, InputValidationError, NotFoundError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { addProcessBulkUploadJob } from '../jobQueue';
import type { Request, Response, NextFunction } from 'express';
import type { BulkUpload, BulkUploadCreate } from '../types';

const createBulkUpload = (
	req: Request<unknown, unknown, BulkUploadCreate>,
	res: Response,
	next: NextFunction,
): void => {
	const { body } = req;
	if (!isBulkUploadCreate(body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isBulkUploadCreate.errors ?? [],
			),
		);
		return;
	}

	if (!body.sourceKey.startsWith(`${S3_UNPROCESSED_KEY_PREFIX}/`)) {
		next(
			new InputValidationError(
				`sourceKey must be unprocessed, and begin with '${S3_UNPROCESSED_KEY_PREFIX}/'.`,
				[],
			),
		);
		return;
	}

	(async () => {
		const bulkUploadsQueryResult = await db.sql<BulkUpload>(
			'bulkUploads.insertOne',
			{
				fileName: body.fileName,
				sourceKey: body.sourceKey,
				status: BulkUploadStatus.PENDING,
			},
		);
		const bulkUpload = bulkUploadsQueryResult.rows[0];
		if (!bulkUpload) {
			throw new NotFoundError(
				'The database did not return an entity after bulk upload creation.',
			);
		}
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

const readBulkUploads = (
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
	createBulkUpload,
	readBulkUploads,
};
