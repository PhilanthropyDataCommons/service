/* eslint-disable import/no-default-export --
 * Jest expects a single default function to be exported from this file.
 */
import { requireEnv } from 'require-env-variable';
import {
	createDatabase,
	createOrUpdateUser,
	initializeDatabase,
	loadOrCreateS3Bucket,
	migrate,
} from '../database';
import {
	assertTestDatabaseName,
	createTestAdminClient,
	GOLD_DATABASE_NAME,
} from './testDatabase';
import { buildConnectionString } from './harnessFunctions';
import {
	getTestUserKeycloakUserId,
	getTestUserKeycloakUserName,
} from './utils';
import baseGlobalSetup from './globalSetup';
import type { Config } from 'jest';

export default async (
	globalConfig: Config,
	projectConfig: Config,
): Promise<void> => {
	baseGlobalSetup(globalConfig, projectConfig);

	const { S3_BUCKET, S3_REGION, S3_ENDPOINT } = requireEnv(
		'S3_BUCKET',
		'S3_REGION',
		'S3_ENDPOINT',
	);

	assertTestDatabaseName(GOLD_DATABASE_NAME);
	const adminClient = createTestAdminClient();
	await adminClient.connect();
	await adminClient.query(`DROP DATABASE IF EXISTS ${GOLD_DATABASE_NAME}`);
	await adminClient.query(`CREATE DATABASE ${GOLD_DATABASE_NAME}`);
	await adminClient.end();

	const connectionString = buildConnectionString(GOLD_DATABASE_NAME);
	const goldDb = createDatabase(connectionString);
	try {
		await migrate(goldDb);
		await initializeDatabase(goldDb);

		await createOrUpdateUser(goldDb, null, {
			keycloakUserId: getTestUserKeycloakUserId(),
			keycloakUserName: getTestUserKeycloakUserName(),
		});

		await loadOrCreateS3Bucket(goldDb, null, {
			name: S3_BUCKET,
			region: S3_REGION,
			endpoint: S3_ENDPOINT,
		});
	} finally {
		await goldDb.close();
	}
};
