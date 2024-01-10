import { S3 } from '@aws-sdk/client-s3';
import { requireEnv } from 'require-env-variable';

const {
	S3_ACCESS_KEY_ID,
	S3_ACCESS_SECRET,
	S3_ENDPOINT,
	S3_PATH_STYLE,
	S3_REGION,
} = requireEnv(
	'S3_ACCESS_KEY_ID',
	'S3_ACCESS_SECRET',
	'S3_ENDPOINT',
	'S3_PATH_STYLE',
	'S3_REGION',
);

export const s3Client = new S3({
	forcePathStyle: S3_PATH_STYLE === 'true',
	endpoint: S3_ENDPOINT,
	region: S3_REGION,
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_ACCESS_SECRET,
	},
});

export const S3_UNPROCESSED_KEY_PREFIX = 'unprocessed';
export const S3_BULK_UPLOADS_KEY_PREFIX = 'bulk-uploads';
