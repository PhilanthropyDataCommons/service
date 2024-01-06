import express from 'express';
import { requireEnv } from 'require-env-variable';
import swaggerUi from 'swagger-ui-express';
import documentation from '../openapi.json';
import { issuer } from '../auth/jwtOptions';
import { isJsonObject } from '../types';
import type { SwaggerUiOptions } from 'swagger-ui-express';

const { OPENAPI_DOCS_AUTH_CLIENT_ID } = requireEnv(
	'OPENAPI_DOCS_AUTH_CLIENT_ID',
);

// Pre-fill expected OIDC/OAuth values in the documentation UI.
const options: SwaggerUiOptions = {
	// The `oauth` key in options is specific to `swagger-ui-express`.
	// The keys inside are from `swagger-ui` proper.
	// See https://swagger.io/docs/open-source-tools/swagger-ui/usage/oauth2/.
	swaggerOptions: {
		oauth: {
			clientId: OPENAPI_DOCS_AUTH_CLIENT_ID,
			scopes: ['openid', 'roles', 'profile'],
			usePkceWithAuthorizationCodeGrant: true,
		},
	},
};

const documentationRouter = express.Router();

documentationRouter.use('/', swaggerUi.serve);
if (isJsonObject(documentation)) {
	// Substitute the authorization server URLs using the issuer loaded by `../auth/jwtOptions`.
	const authCodeWithNewIssuer = {
		...documentation.components.securitySchemes.auth.flows.authorizationCode,
		authorizationUrl: `${issuer}/protocol/openid-connect/auth`,
		tokenUrl: `${issuer}/protocol/openid-connect/token`,
		refreshUrl: `${issuer}/protocol/openid-connect/token`,
	};
	documentation.components.securitySchemes.auth.flows.authorizationCode =
		authCodeWithNewIssuer;
	documentationRouter.get('/', swaggerUi.setup(documentation, options));
}

export { documentationRouter };
