import express from 'express';
import { sourcesHandlers } from '../handlers/sourcesHandlers';
import { requireAuthentication, requireAdministratorRole } from '../middleware';

const sourcesRouter = express.Router();

sourcesRouter.get('/', requireAuthentication, sourcesHandlers.getSources);

sourcesRouter.get(
	'/:sourceId',
	requireAuthentication,
	sourcesHandlers.getSource,
);

sourcesRouter.post('/', requireAuthentication, sourcesHandlers.postSource);

sourcesRouter.post('/', requireAdministratorRole, sourcesHandlers.postSource);

sourcesRouter.delete(
	'/:sourceId',
	requireAdministratorRole,
	sourcesHandlers.deleteSource,
);

export { sourcesRouter };
