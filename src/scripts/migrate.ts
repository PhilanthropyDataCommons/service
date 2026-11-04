import * as Sentry from '@sentry/node';
import { initSentry } from '../sentry';
import { getLogger } from '../logger';
import { createDatabase, migrate } from '../database';
import { EXIT_CODE_FAILURE, TWO_SECONDS_IN_MS } from '../constants';

initSentry();

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
		Sentry.captureException(reason);
		await db.close();
		await Sentry.close(TWO_SECONDS_IN_MS);
		process.exitCode = EXIT_CODE_FAILURE;
	});
