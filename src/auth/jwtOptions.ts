import { expressJwtSecret } from 'jwks-rsa';
import { requireEnv } from 'require-env-variable';
import type { Params } from 'express-jwt';

const { AUTH_SERVER_ISSUER } = requireEnv('AUTH_SERVER_ISSUER');
const JWKS_REQUESTS_PER_MINUTE = 100;

// The `jsonwebtoken` type `VerifyOptions` can have issuer as either `string` or `string[]`. In
// test code, we would like to use the valid exact issuer that was set up here. Therefore export
// issuer separately as a string and re-use below when setting jwtOptions.
export const issuer = AUTH_SERVER_ISSUER;

export const jwtOptions: Params = {
	secret: expressJwtSecret({
		jwksUri: `${AUTH_SERVER_ISSUER}/protocol/openid-connect/certs`,
		rateLimit: true,
		jwksRequestsPerMinute: JWKS_REQUESTS_PER_MINUTE,
	}),
	issuer,
	algorithms: ['RS256'],
	credentialsRequired: false,
};
