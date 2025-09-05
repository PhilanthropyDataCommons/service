import { generateCreateOrUpdateItemOperation } from '../generators';
import type { S3Bucket, InternallyWritableS3Bucket } from '../../../types';

const loadOrCreateS3Bucket = generateCreateOrUpdateItemOperation<
	S3Bucket,
	InternallyWritableS3Bucket,
	[]
>('s3Buckets.selectOrCreateOne', ['name', 'region', 'endpoint'], []);
export { loadOrCreateS3Bucket };
