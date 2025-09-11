import path from 'node:path';
import { migrate as pgMigrate } from 'postgres-schema-migrations';
import { requireEnv } from 'require-env-variable';
import { runJobQueueMigrations } from '../jobQueue';
import { getLogger } from '../logger';
import { db } from './db';
import type { PoolClient } from 'pg';

const logger = getLogger(__filename);

const { S3_ENDPOINT, S3_BUCKET, S3_REGION } = requireEnv(
	'S3_ENDPOINT',
	'S3_BUCKET',
	'S3_REGION',
);

try {
	requireEnv('PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGHOST', 'PGPORT');
} catch (err) {
	logger.warn(
		err,
		'The pg module usually expects some environment variables starting with "PG".',
	);
}

const setPsqlSetting = async (
	client: PoolClient,
	setting: string,
	value: string,
): Promise<void> => {
	await client.query('SELECT set_config($1, $2, false)', [setting, value]);
};

const setPsqlSettingsForMigrations = async (
	client: PoolClient,
): Promise<void> => {
	await setPsqlSetting(client, 'app.s3_endpoint', S3_ENDPOINT);
	await setPsqlSetting(client, 'app.s3_bucket', S3_BUCKET);
	await setPsqlSetting(client, 'app.s3_region', S3_REGION);
	logger.info(
		`Set migration settings: S3_ENDPOINT=${S3_ENDPOINT}, S3_BUCKET=${S3_BUCKET}, S3_REGION=${S3_REGION}`,
	);
};

export const migrate = async (schema = 'public'): Promise<void> => {
	const client = await db.getClient();
	try {
		await setPsqlSettingsForMigrations(client);
		await pgMigrate({ client }, path.resolve(__dirname, 'migrations'), {
			logger: (msg) => {
				logger.info(msg);
			},
			schema,
		});
		await runJobQueueMigrations();
	} finally {
		client.release();
	}
};
