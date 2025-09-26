import { requireEnv } from 'require-env-variable';
import { db, loadSystemUser, loadOrCreateS3Bucket } from './database';
import { InternalValidationError } from './errors';
import type { User, S3Bucket } from './types';

const { S3_BUCKET, S3_REGION, S3_ENDPOINT } = requireEnv(
	'S3_BUCKET',
	'S3_REGION',
	'S3_ENDPOINT',
);

let systemUser: User | null = null;
let defaultS3Bucket: S3Bucket | null = null;

export const loadConfig = async (): Promise<void> => {
	systemUser = await loadSystemUser(db, null);
	defaultS3Bucket = await loadOrCreateS3Bucket(db, null, {
		name: S3_BUCKET,
		region: S3_REGION,
		endpoint: S3_ENDPOINT,
	});
};

export const getSystemUser = (): User => {
	if (systemUser === null) {
		throw new InternalValidationError('System user not loaded', []);
	}
	return systemUser;
};

export const getDefaultS3Bucket = (): S3Bucket => {
	if (defaultS3Bucket === null) {
		throw new InternalValidationError('Default S3 bucket not loaded', []);
	}
	return defaultS3Bucket;
};
