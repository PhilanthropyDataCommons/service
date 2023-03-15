import express from 'express';
import { proposalsHandlers } from '../handlers/proposalsHandlers';
import { checkApiKey as verifyAuth } from '../middleware/apiKeyChecker';

const proposalsRouter = express.Router();

proposalsRouter.get('/:id', verifyAuth, proposalsHandlers.getProposal);
proposalsRouter.get('/', verifyAuth, proposalsHandlers.getProposals);
proposalsRouter.post('/', verifyAuth, proposalsHandlers.postProposal);

export { proposalsRouter };
