import express from 'express';
import { proposalsHandlers } from '../handlers/proposalsHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const proposalsRouter = express.Router();

proposalsRouter.get('/', checkApiKey, proposalsHandlers.getProposals);
proposalsRouter.post('/', checkApiKey, proposalsHandlers.postProposal);

export { proposalsRouter };
