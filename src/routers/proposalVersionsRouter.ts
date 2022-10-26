import express from 'express';
import { proposalVersionsHandlers } from '../handlers/proposalVersionsHandlers';

const proposalVersionsRouter = express.Router();

proposalVersionsRouter.post('/', proposalVersionsHandlers.postProposalVersion);

export { proposalVersionsRouter };
