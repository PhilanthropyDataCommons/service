import path from 'path';
import { migrate as pgMigrate } from 'postgres-schema-migrations';
import { runJobQueueMigrations } from '../jobQueue';
import { getLogger } from '../logger';
import { db } from './db';

const logger = getLogger(__filename);

export const migrate = async (schema = 'public'): Promise<void> => {
	const client = await db.getClient();
	try {
		await pgMigrate({ client }, path.resolve(__dirname, 'migrations'), {
			logger: (msg) => logger.info(msg),
			schema,
		});
		await runJobQueueMigrations();
	} finally {
		client.release();
	}
};
