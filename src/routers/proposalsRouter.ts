import express from 'express';
import { proposalsHandlers } from '../handlers/proposalsHandlers';
import { requireAuthentication } from '../middleware';

const proposalsRouter = express.Router();

proposalsRouter.get(
	'/:id',
	requireAuthentication,
	proposalsHandlers.getProposal,
);

proposalsRouter.get('/', requireAuthentication, proposalsHandlers.getProposals);

proposalsRouter.post(
	'/',
	requireAuthentication,
	proposalsHandlers.postProposal,
);

export { proposalsRouter };
