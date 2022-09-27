import express from 'express';
import { opportunitiesHandlers } from '../handlers/opportunitiesHandlers';

const opportunitiesRouter = express.Router();

opportunitiesRouter.post('/', opportunitiesHandlers.postOpportunity);
opportunitiesRouter.get('/:id', opportunitiesHandlers.getOpportunity);
opportunitiesRouter.get('/', opportunitiesHandlers.getOpportunities);

export { opportunitiesRouter };
