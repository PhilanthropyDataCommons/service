import express from 'express';
import { proposalVersionsHandlers } from '../handlers/proposalVersionsHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const proposalVersionsRouter = express.Router();

proposalVersionsRouter.post('/', checkApiKey, proposalVersionsHandlers.postProposalVersion);

export { proposalVersionsRouter };
