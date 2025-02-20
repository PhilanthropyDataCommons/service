import express from 'express';
import { sourcesHandlers } from '../handlers/sourcesHandlers';
import { requireAuthentication } from '../middleware';

const sourcesRouter = express.Router();

sourcesRouter.get('/', requireAuthentication, sourcesHandlers.getSources);

sourcesRouter.get(
	'/:sourceId',
	requireAuthentication,
	sourcesHandlers.getSource,
);

sourcesRouter.post('/', requireAuthentication, sourcesHandlers.postSource);

export { sourcesRouter };
