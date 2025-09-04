import { createFile } from '../../database';
import { createTestS3Bucket } from './createTestS3Bucket';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	InternallyWritableFile,
	File,
	S3Bucket,
} from '../../types';

let defaultS3Bucket: S3Bucket | null = null;

const getDefaultS3Bucket = async (
	db: TinyPg,
	authContext: AuthContext,
): Promise<S3Bucket> => {
	defaultS3Bucket ??= await createTestS3Bucket(db, authContext);
	return defaultS3Bucket;
};

const createTestFile = async (
	db: TinyPg,
	authContext: AuthContext,
	overrideValues?: Partial<InternallyWritableFile>,
): Promise<File> => {
	const defaultS3Bucket = await getDefaultS3Bucket(db, authContext);
	const defaultValues = {
		s3BucketName: defaultS3Bucket.name,
		name: 'test.csv',
		mimeType: 'text/csv',
		size: 123,
	};
	return await createFile(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestFile };
