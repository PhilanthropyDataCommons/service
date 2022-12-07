import dotenv from 'dotenv';
import pino from 'pino';
import type {
  Logger,
} from 'pino';

// Calling dotenv.config() prior to creating a logger ensures that environment
// variable LOG_LEVEL can be loaded from .env files. See
// https://github.com/PhilanthropyDataCommons/service/issues/59#issuecomment-1197227254
// and following. There may be a better place than including and calling dotenv
// here in the logger code.
dotenv.config();

export const redactAllButFirstAndLastThreeDigits = (secret: string): string => {
  // We want to redact much more than we log. These are usually >=80 characters.
  if (secret.length >= 24) {
    return `${secret.slice(0, 3)}...[redacted]...${secret.slice(-3)}`;
  }

  return '[redacted a secret that was too short]';
};

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['req.headers["x-api-key"]'],
    censor: redactAllButFirstAndLastThreeDigits,
  },
});

export const getLogger = (source: string): Logger => logger.child({ source });
