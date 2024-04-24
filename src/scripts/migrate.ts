import { getLogger } from '../logger';
import { db, migrate } from '../database';

const logger = getLogger(__filename);

logger.info('Starting migrations...');
migrate()
	.then(async () => {
		logger.info('Migrations complete.');
		await db.close();
	})
	.catch(async (reason: unknown) => {
		logger.error('Migrations failed!');
		if (reason instanceof Error) {
			logger.error(`${reason.message}`);
		}
		await db.close();
		process.exit(1);
	});
