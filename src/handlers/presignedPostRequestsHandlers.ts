import { v4 as uuidv4 } from 'uuid';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { requireEnv } from 'require-env-variable';
import { s3Client } from '../s3Client';
import { isPresignedPostRequestWrite } from '../types';
import { InputValidationError } from '../errors';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import type { Request, Response } from 'express';

const { S3_BUCKET } = requireEnv('S3_BUCKET');

const generatePresignedPost = async (
	fileType: string,
	fileSize: number,
): Promise<PresignedPost> =>
	createPresignedPost(s3Client, {
		Bucket: S3_BUCKET,
		Key: `unprocessed/${uuidv4()}`,
		Expires: 3600, // 1 hour
		Conditions: [
			['eq', '$Content-Type', fileType],
			['content-length-range', fileSize, fileSize],
		],
	});

const createPresignedPostRequest = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const body = req.body as unknown;
	if (!isPresignedPostRequestWrite(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isPresignedPostRequestWrite.errors ?? [],
		);
	}

	const { fileType, fileSize } = body;
	const presignedPost = await generatePresignedPost(fileType, fileSize);
	res.status(201).contentType('application/json').send({
		fileType,
		fileSize,
		presignedPost,
	});
};

export const presignedPostRequestsHandlers = {
	createPresignedPostRequest,
};
