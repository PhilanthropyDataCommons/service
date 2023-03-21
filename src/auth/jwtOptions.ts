import { expressJwtSecret } from 'jwks-rsa';
import { requireEnv } from 'require-env-variable';
import type {
  GetVerificationKey,
  Params,
} from 'express-jwt';

const {
  AUTH_SERVER_ISSUER,
} = requireEnv(
  'AUTH_SERVER_ISSUER',
);

// The `jsonwebtoken` type `VerifyOptions` can have issuer as either `string` or `string[]`. In
// test code, we would like to use the valid exact issuer that was set up here. Therefore export
// issuer separately as a string and re-use below when setting jwtOptions.
export const issuer = AUTH_SERVER_ISSUER;

export const jwtOptions: Params = {
  // Because of different types from version-to-version in express-jwt (see jwks-rsa notes), cast
  // to the later express-jwt API's GetVerificationKey.The jwks-rsa notes can be found in
  // `node_modules/jwks-rsa/index.d.ts` or here:
  // https://github.com/auth0/node-jwks-rsa/blob/83d0202a9f462451c0e1e2adb1d91280ee1ef30c/index.d.ts#L60
  secret: expressJwtSecret({
    jwksUri: `${AUTH_SERVER_ISSUER}/protocol/openid-connect/certs`,
    rateLimit: true,
    jwksRequestsPerMinute: 100,
  }) as GetVerificationKey,
  issuer,
  algorithms: ['RS256'],
  credentialsRequired: true,
};
