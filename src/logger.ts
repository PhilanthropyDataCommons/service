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

// To prevent replays with JWT, we can redact the signature. This invalidates the JWT.
export const redactToPreventAuthReplay = (secret: string): string => secret.replace(
  /^(Bearer [A-Za-z0-9]*\.[A-Za-z0-9]*\.).*/,
  '$1[redacted]',
);

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['req.headers["authorization"]'],
    censor: redactToPreventAuthReplay,
  },
});

export const getLogger = (source: string): Logger => logger.child({ source });
