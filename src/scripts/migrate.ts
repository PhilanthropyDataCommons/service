import { getLogger } from '../logger';
import { createDatabase, migrate } from '../database';
import { EXIT_CODE_FAILURE } from '../constants';

const logger = getLogger(__filename);

const db = createDatabase();

logger.info('Starting migrations...');
migrate(db)
	.then(async () => {
		logger.info('Migrations complete.');
		await db.close();
	})
	.catch(async (reason: unknown) => {
		logger.error('Migrations failed!');
		if (reason instanceof Error) {
			logger.error(reason.message);
		}
		await db.close();
		process.exit(EXIT_CODE_FAILURE);
	});
