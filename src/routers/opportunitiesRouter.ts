import express from 'express';
import { opportunitiesHandlers } from '../handlers/opportunitiesHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const opportunitiesRouter = express.Router();

opportunitiesRouter.post('/', checkApiKey, opportunitiesHandlers.postOpportunity);
opportunitiesRouter.get('/:id', opportunitiesHandlers.getOpportunity);
opportunitiesRouter.get('/', opportunitiesHandlers.getOpportunities);

export { opportunitiesRouter };
