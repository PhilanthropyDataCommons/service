import type { Writable } from './Writable';

interface S3Bucket {
	readonly name: string;
	readonly region: string;
	readonly endpoint: string;
	readonly createdAt: string;
}
type InternallyWritableS3Bucket = Writable<S3Bucket> &
	Pick<S3Bucket, 'name' | 'region' | 'endpoint'>;

export { type S3Bucket, type InternallyWritableS3Bucket };
