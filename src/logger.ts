import pino from 'pino';
import type { Logger } from 'pino';

// To prevent replays with JWT, we can redact the signature. This invalidates the JWT.
export const redactToPreventAuthReplay = (secret: string): string =>
	secret.replace(/^(Bearer [A-Za-z0-9]*\.[A-Za-z0-9]*\.).*/, '$1[redacted]');

const logger = pino({
	level: process.env.LOG_LEVEL ?? 'info',
	redact: {
		paths: ['req.headers["authorization"]'],
		censor: redactToPreventAuthReplay,
	},
});

export const getLogger = (source: string): Logger => logger.child({ source });
