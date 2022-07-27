import { getLogger } from '../logger';
import { migrate } from '../database';

const logger = getLogger(__filename);

logger.info('Starting migrations...');
migrate()
  .then(() => {
    logger.info('Migrations complete.');
  })
  .catch((reason: unknown) => {
    logger.error('Migrations failed!');
    if (reason instanceof Error) {
      logger.error(`${reason.message}`);
    }
    process.exit(1);
  });
