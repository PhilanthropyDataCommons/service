import { HTTP_STATUS } from '../constants';
import { isAuthContext, isWritableFile } from '../types';
import { createFile, loadFileBundle } from '../database/operations';
import { db, getLimitValues } from '../database';
import { InputValidationError, FailedMiddlewareError } from '../errors';
import { generatePresignedPost } from '../s3';
import { getDefaultS3Bucket } from '../config';
import {
	extractCreatedByParameters,
	extractPaginationParameters,
} from '../queryParameters';
import type { Request, Response } from 'express';

const getFiles = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { createdBy } = extractCreatedByParameters(req);
	const fileBundle = await loadFileBundle(db, req, createdBy, limit, offset);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(fileBundle);
};

const postFile = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritableFile(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableFile.errors ?? [],
		);
	}

	const { name, mimeType, size } = body;
	const s3Bucket = getDefaultS3Bucket();

	const file = await createFile(db, req, {
		name,
		mimeType,
		size,
		s3BucketName: s3Bucket.name,
	});
	const presignedPost = await generatePresignedPost(
		file.storageKey,
		file.mimeType,
		file.size,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send({
			...file,
			presignedPost,
		});
};

export const filesHandlers = {
	getFiles,
	postFile,
};
