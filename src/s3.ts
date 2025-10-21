import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { S3, type S3ClientConfig, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireEnv } from 'require-env-variable';
import { ONE_DAY_IN_SECONDS } from './constants';
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
const PRESIGNED_DOWNLOAD_URL_EXPIRATION_SECONDS = ONE_DAY_IN_SECONDS;

const s3Clients: Record<string, S3> = {};

export const getS3Client = (overrides?: Partial<S3ClientConfig>): S3 => {
	const defaults = {
		forcePathStyle: S3_PATH_STYLE === 'true',
		endpoint: S3_ENDPOINT,
		region: S3_REGION,
		credentials: {
			accessKeyId: S3_ACCESS_KEY_ID,
			secretAccessKey: S3_ACCESS_SECRET,
		},
	};
	const { region } = { ...defaults, ...overrides };
	const clientKey = region.toString();
	s3Clients[clientKey] ??= new S3({
		...defaults,
		...overrides,
	});
	return s3Clients[clientKey];
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

export const generatePresignedDownloadUrl = async (
	storageKey: string,
	bucketName?: string,
): Promise<string> => {
	const command = new GetObjectCommand({
		Bucket: bucketName ?? S3_BUCKET,
		Key: storageKey,
	});

	const url = await getSignedUrl(getS3Client(), command, {
		expiresIn: PRESIGNED_DOWNLOAD_URL_EXPIRATION_SECONDS,
	});

	return url;
};
