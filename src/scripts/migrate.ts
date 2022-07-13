import { logger as root_logger } from '../logger';
import { migrate } from '../database';

const logger = root_logger.child({ source: 'migrate' });

logger.info('Starting migrations...');
migrate()
  .then(() => {
    logger.info('Migrations complete.');
    process.exit();
  })
  .catch((reason: unknown) => {
    logger.error('Migrations failed!');
    if (reason instanceof Error) {
      logger.error(`${reason.message}`);
    }
    process.exit(1);
  });
