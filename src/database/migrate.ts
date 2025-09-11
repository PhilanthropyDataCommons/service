import path from 'node:path';
import { migrate as pgMigrate } from 'postgres-schema-migrations';
import { requireEnv } from 'require-env-variable';
import { runJobQueueMigrations } from '../jobQueue';
import { getLogger } from '../logger';
import { db } from './db';
import type { PoolClient } from 'pg';

const logger = getLogger(__filename);
const { S3_ENDPOINT } = requireEnv('S3_ENDPOINT');

try {
	requireEnv('PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGHOST', 'PGPORT');
} catch (err) {
	logger.warn(
		err,
		'The pg module usually expects some environment variables starting with "PG".',
	);
}

const setPsqlSettingsForMigrations = async (
	client: PoolClient,
): Promise<void> => {
	await client.query('SELECT set_config($1, $2, false)', [
		'app.s3_endpoint',
		S3_ENDPOINT,
	]);
	logger.info(`Set migration settings: S3_ENDPOINT=${S3_ENDPOINT}`);
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
