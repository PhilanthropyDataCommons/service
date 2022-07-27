import pino from 'pino';
import type {
  Logger,
} from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'silent',
});

export const getLogger = (source: string): Logger => logger.child({ source });
