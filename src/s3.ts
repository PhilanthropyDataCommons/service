import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { S3 } from '@aws-sdk/client-s3';
import { requireEnv } from 'require-env-variable';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';

const {
	S3_ACCESS_KEY_ID,
	S3_ACCESS_SECRET,
	S3_ENDPOINT,
	S3_PATH_STYLE,
	S3_REGION,
	S3_BUCKET,
} = requireEnv(
	'S3_ACCESS_KEY_ID',
	'S3_ACCESS_SECRET',
	'S3_ENDPOINT',
	'S3_PATH_STYLE',
	'S3_REGION',
	'S3_BUCKET',
);

const PRESIGNED_POST_EXPIRATION_SECONDS = 3600; // 1 hour

const s3Clients: Record<string, S3> = {};

export const getS3Client = (region = S3_REGION): S3 => {
	s3Clients[region] ??= new S3({
		forcePathStyle: S3_PATH_STYLE === 'true',
		endpoint: S3_ENDPOINT,
		region,
		credentials: {
			accessKeyId: S3_ACCESS_KEY_ID,
			secretAccessKey: S3_ACCESS_SECRET,
		},
	});
	return s3Clients[region];
};

export const generatePresignedPost = async (
	key: string,
	mimeType: string,
	size: number,
): Promise<PresignedPost> =>
	await createPresignedPost(getS3Client(), {
		Bucket: S3_BUCKET,
		Key: key,
		Expires: PRESIGNED_POST_EXPIRATION_SECONDS,
		Conditions: [
			['eq', '$Content-Type', mimeType],
			['content-length-range', size, size],
		],
	});
