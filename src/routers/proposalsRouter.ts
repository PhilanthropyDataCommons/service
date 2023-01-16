import express from 'express';
import { proposalsHandlers } from '../handlers/proposalsHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const proposalsRouter = express.Router();

proposalsRouter.get('/:id', checkApiKey, proposalsHandlers.getProposal);
proposalsRouter.get('/', checkApiKey, proposalsHandlers.getProposals);
proposalsRouter.post('/', checkApiKey, proposalsHandlers.postProposal);

export { proposalsRouter };
