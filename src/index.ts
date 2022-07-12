import dotenv from 'dotenv';
import { app } from './app';
import { logger } from './logger';

dotenv.config();

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? 'localhost';

app.listen(
  port,
  host,
  () => {
    logger.info(`Server running on ${host}:${port}`);
  },
);
