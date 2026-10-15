// Loading this module initializes Sentry. It must stay the first import so
// that Sentry is set up before the modules it instruments are loaded.
import '../instrument';
import * as Sentry from '@sentry/node';
import { getLogger } from '../logger';
import { createDatabase, migrate } from '../database';
import { EXIT_CODE_FAILURE, TWO_SECONDS_IN_MS } from '../constants';

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
		await Sentry.flush(TWO_SECONDS_IN_MS);
		await db.close();
		process.exitCode = EXIT_CODE_FAILURE;
	});
