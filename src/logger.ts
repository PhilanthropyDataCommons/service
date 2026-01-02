import pino from 'pino';
import type { Logger } from 'pino';

/**
 * To prevent replay attacks, redact the JWT signature. This invalidates it.
 */
const redactBearerString = (secret: string): string =>
	secret.replace(
		/^(?<prefix>Bearer [A-Za-z0-9]*\.[A-Za-z0-9]*\.).*/,
		'$<prefix>[redacted]',
	);

/**
 * This is a censor function adapter matching pino.redactOptions.censor.
 * The scope of this function is far broader than our targeted use. We only
 * do things when the path is what we expect.
 * @see pino.redactOptions.censor
 * @param value Pino has this as `any` but we adjusted it to `unknown`.
 * @param string[] The object property path where the value was found.
 */
export const redactToPreventAuthReplay = (
	value: unknown,
	path: string[],
): unknown => {
	// The following line makes use of `path` to ensure we only act upon paths
	// related to authorization. This means we throw an error in the narrow
	// case that we care about (redacting authorization tokens) rather than any
	// value that comes through our function from any context. While this check
	// is redundant with the `paths` specified below in the pino options, it
	// should make double-sure that we only throw an error in the expected case.
	// Furthermore, making use of `path` means we don't have to silence tslint.
	if (!path.includes('authorization') || value === undefined) return value;
	if (typeof value === 'string') return redactBearerString(value);
	throw new Error(
		`Unexpected authorization value from pino. path: ${JSON.stringify(path)}, type: ${typeof value}, value: ${JSON.stringify(value)}`,
	);
};

const logger = pino({
	level: process.env.LOG_LEVEL ?? 'info',
	redact: {
		paths: ['req.headers["authorization"]'],
		censor: redactToPreventAuthReplay,
	},
});

export const getLogger = (source: string): Logger => logger.child({ source });
