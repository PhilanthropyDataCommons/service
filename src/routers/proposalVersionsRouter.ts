import express from 'express';
import { proposalVersionsHandlers } from '../handlers/proposalVersionsHandlers';
import { requireAuthentication } from '../middleware';

const proposalVersionsRouter = express.Router();

proposalVersionsRouter.post(
	'/',
	requireAuthentication,
	proposalVersionsHandlers.postProposalVersion,
);

proposalVersionsRouter.get(
	'/:proposalVersionId',
	requireAuthentication,
	proposalVersionsHandlers.getProposalVersion,
);

export { proposalVersionsRouter };
