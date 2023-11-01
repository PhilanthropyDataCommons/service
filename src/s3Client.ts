import { S3 } from '@aws-sdk/client-s3';

export const s3Client = new S3({
  forcePathStyle: false,
  endpoint: process.env.S3_ENDPOINT as string,
  region: 'us-east-1', // This is required but not actually used by the S3 sdk
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_ACCESS_SECRET as string,
  },
});
