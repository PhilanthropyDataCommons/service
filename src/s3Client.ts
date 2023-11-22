import { S3 } from '@aws-sdk/client-s3';
import { requireEnv } from 'require-env-variable';

const {
  S3_ACCESS_KEY_ID,
  S3_ACCESS_SECRET,
  S3_ENDPOINT,
} = requireEnv(
  'S3_ACCESS_KEY_ID',
  'S3_ACCESS_SECRET',
  'S3_ENDPOINT',
);

export const s3Client = new S3({
  forcePathStyle: false,
  endpoint: S3_ENDPOINT,
  region: 'us-east-1', // This is required but not actually used by the S3 sdk
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_ACCESS_SECRET,
  },
});
