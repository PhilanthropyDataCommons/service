import express from 'express';
import { proposalsHandlers } from '../handlers/proposalsHandlers';

const proposalsRouter = express.Router();

proposalsRouter.get('/', proposalsHandlers.getProposals);
proposalsRouter.post('/', proposalsHandlers.postProposal);

export { proposalsRouter };
