import path from 'node:path';
import { migrate as pgMigrate } from 'postgres-schema-migrations';
import { requireEnv } from 'require-env-variable';
import { runJobQueueMigrations } from '../jobQueue';
import { getLogger } from '../logger';
import { db } from './db';

const logger = getLogger(__filename);

try {
	requireEnv('PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGHOST', 'PGPORT');
} catch (err) {
	logger.warn(
		err,
		'The pg module usually expects some environment variables starting with "PG".',
	);
}

export const migrate = async (schema = 'public'): Promise<void> => {
	const client = await db.getClient();
	try {
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
