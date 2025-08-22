import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { requireEnv } from 'require-env-variable';
import { HTTP_STATUS } from '../constants';
import { s3Client } from '../s3Client';
import { isPresignedPostRequestWrite, isAuthContext } from '../types';
import { loadFile } from '../database/operations';
import { db } from '../database';
import {
	InputValidationError,
	FailedMiddlewareError,
	NotFoundError,
} from '../errors';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import type { Request, Response } from 'express';

const { S3_BUCKET } = requireEnv('S3_BUCKET');

const PRESIGNED_POST_EXPIRATION_SECONDS = 3600; // 1 hour

const generatePresignedPost = async (
	fileUuid: string,
	mimeType: string,
	size: number,
): Promise<PresignedPost> =>
	await createPresignedPost(s3Client, {
		Bucket: S3_BUCKET,
		Key: fileUuid,
		Expires: PRESIGNED_POST_EXPIRATION_SECONDS,
		Conditions: [
			['eq', '$Content-Type', mimeType],
			['content-length-range', size, size],
		],
	});

const createPresignedPostRequest = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isPresignedPostRequestWrite(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isPresignedPostRequestWrite.errors ?? [],
		);
	}

	const { fileUuid } = body;

	const file = await loadFile(db, req, fileUuid)
		.then((f) => {
			// For now we don't want to allow *anybody* except the user who created
			// a file to generate a presigned post.  Some day maybe this will become
			// a permission-based check instead.
			if (f.createdBy !== req.user.keycloakUserId) {
				throw new InputValidationError('Invalid fileUuid.', []);
			}
			return f;
		})
		.catch((error: unknown) => {
			if (error instanceof NotFoundError) {
				throw new InputValidationError('Invalid fileUuid.', []);
			}
			throw error;
		});

	const presignedPost = await generatePresignedPost(
		file.uuid,
		file.mimeType,
		file.size,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send({
			fileUuid,
			presignedPost,
		});
};

export const presignedPostRequestsHandlers = {
	createPresignedPostRequest,
};
