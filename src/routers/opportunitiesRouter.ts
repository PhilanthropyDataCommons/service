import express from 'express';
import { opportunitiesHandlers } from '../handlers/opportunitiesHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const opportunitiesRouter = express.Router();

opportunitiesRouter.post('/', checkApiKey, opportunitiesHandlers.postOpportunity);
opportunitiesRouter.get('/:id', checkApiKey, opportunitiesHandlers.getOpportunity);
opportunitiesRouter.get('/', checkApiKey, opportunitiesHandlers.getOpportunities);

export { opportunitiesRouter };
