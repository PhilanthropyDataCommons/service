import express from 'express';
import { proposalsHandlers } from '../handlers/proposalsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const proposalsRouter = express.Router();

proposalsRouter.get('/:id', verifyAuth, proposalsHandlers.getProposal);
proposalsRouter.get('/', verifyAuth, proposalsHandlers.getProposals);
proposalsRouter.post('/', verifyAuth, proposalsHandlers.postProposal);

export { proposalsRouter };
