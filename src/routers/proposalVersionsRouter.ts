import express from 'express';
import { proposalVersionsHandlers } from '../handlers/proposalVersionsHandlers';
import { checkApiKey as verifyAuth } from '../middleware/apiKeyChecker';

const proposalVersionsRouter = express.Router();

proposalVersionsRouter.post('/', verifyAuth, proposalVersionsHandlers.postProposalVersion);

export { proposalVersionsRouter };
