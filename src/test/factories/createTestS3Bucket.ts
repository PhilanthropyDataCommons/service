import { requireEnv } from 'require-env-variable';
import { loadOrCreateS3Bucket } from '../../database';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	S3Bucket,
	InternallyWritableS3Bucket,
} from '../../types';

const { S3_ENDPOINT, S3_BUCKET, S3_REGION } = requireEnv(
	'S3_ENDPOINT',
	'S3_BUCKET',
	'S3_REGION',
);

const createTestS3Bucket = async (
	db: TinyPg,
	authContext: AuthContext,
	overrideValues?: Partial<InternallyWritableS3Bucket>,
): Promise<S3Bucket> => {
	const defaultValues = {
		name: S3_BUCKET,
		region: S3_REGION,
		endpoint: S3_ENDPOINT,
	};
	return await loadOrCreateS3Bucket(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestS3Bucket };
