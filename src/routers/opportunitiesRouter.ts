import express from 'express';
import { opportunitiesHandlers } from '../handlers/opportunitiesHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const opportunitiesRouter = express.Router();

opportunitiesRouter.post('/', verifyAuth, opportunitiesHandlers.postOpportunity);
opportunitiesRouter.get('/:id', verifyAuth, opportunitiesHandlers.getOpportunity);
opportunitiesRouter.get('/', verifyAuth, opportunitiesHandlers.getOpportunities);

export { opportunitiesRouter };
