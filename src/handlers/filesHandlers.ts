import { HTTP_STATUS } from '../constants';
import { isAuthContext, isWritableFile } from '../types';
import { createFile } from '../database/operations';
import { db } from '../database';
import { InputValidationError, FailedMiddlewareError } from '../errors';
import { generatePresignedPost } from '../s3';
import { getDefaultS3Bucket } from '../config';
import type { Request, Response } from 'express';

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
	postFile,
};
