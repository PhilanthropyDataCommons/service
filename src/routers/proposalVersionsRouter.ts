import express from 'express';
import { proposalVersionsHandlers } from '../handlers/proposalVersionsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const proposalVersionsRouter = express.Router();

proposalVersionsRouter.post(
	'/',
	verifyAuth,
	proposalVersionsHandlers.postProposalVersion,
);

export { proposalVersionsRouter };
