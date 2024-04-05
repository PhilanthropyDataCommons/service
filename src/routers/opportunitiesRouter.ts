import express from 'express';
import { opportunitiesHandlers } from '../handlers/opportunitiesHandlers';
import { requireAuthentication } from '../middleware';

const opportunitiesRouter = express.Router();

opportunitiesRouter.post(
	'/',
	requireAuthentication,
	opportunitiesHandlers.postOpportunity,
);
opportunitiesRouter.get(
	'/:id',
	requireAuthentication,
	opportunitiesHandlers.getOpportunity,
);
opportunitiesRouter.get(
	'/',
	requireAuthentication,
	opportunitiesHandlers.getOpportunities,
);

export { opportunitiesRouter };
