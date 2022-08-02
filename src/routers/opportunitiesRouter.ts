import express from 'express';
import { opportunitiesHandlers } from '../handlers/opportunitiesHandlers';

const opportunitiesRouter = express.Router();

opportunitiesRouter.use('/', opportunitiesHandlers.getOpportunities);

export { opportunitiesRouter };
