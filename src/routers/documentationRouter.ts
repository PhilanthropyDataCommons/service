import path from 'node:path';
import express from 'express';
import { requireEnv } from 'require-env-variable';
import swaggerUi from 'swagger-ui-express';
import { documentationHandlers } from '../handlers/documentationHandlers';
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
	swaggerUrl: '/openapi/api.json',
};

const documentationRouter = express.Router();
documentationRouter.use('/', swaggerUi.serve);
documentationRouter.get('/', swaggerUi.setup(null, options));
documentationRouter.get(
	'/openapi/api.json',
	documentationHandlers.getRootApiSpec,
);
documentationRouter.get(
	'/openapi/components/securitySchemes/auth.json',
	documentationHandlers.getAuthApiSpec,
);
documentationRouter.use(
	'/openapi',
	express.static(path.join(__dirname, '../openapi')),
);

export { documentationRouter };
