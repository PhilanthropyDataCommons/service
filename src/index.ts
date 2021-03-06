import { app } from './app';
import { getLogger } from './logger';

const logger = getLogger(__filename);

// The .env file is loaded in 'logger' to ensure correct order of events. See
// more discussion in the 'logger.ts' code.

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? 'localhost';

app.listen(
  port,
  host,
  () => {
    logger.info(`Server running on ${host}:${port}`);
  },
);
