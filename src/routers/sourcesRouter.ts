import express from 'express';
import { sourcesHandlers } from '../handlers/sourcesHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const sourcesRouter = express.Router();

sourcesRouter.get('/', requireAuthentication, sourcesHandlers.getSources);

sourcesRouter.get(
	'/:sourceId',
	requireAuthentication,
	sourcesHandlers.getSource,
);

sourcesRouter.post('/', requireAdministratorRole, sourcesHandlers.postSource);

export { sourcesRouter };
