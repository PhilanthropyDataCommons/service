import express from 'express';
import { opportunitiesHandlers } from '../handlers/opportunitiesHandlers';
import { checkApiKey as verifyAuth } from '../middleware/apiKeyChecker';

const opportunitiesRouter = express.Router();

opportunitiesRouter.post('/', verifyAuth, opportunitiesHandlers.postOpportunity);
opportunitiesRouter.get('/:id', verifyAuth, opportunitiesHandlers.getOpportunity);
opportunitiesRouter.get('/', verifyAuth, opportunitiesHandlers.getOpportunities);

export { opportunitiesRouter };
