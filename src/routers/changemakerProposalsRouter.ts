import express from 'express';
import { changemakerProposalsHandlers } from '../handlers/changemakerProposalsHandlers';
import { requireAuthentication } from '../middleware';

const changemakerProposalsRouter = express.Router();

changemakerProposalsRouter.get(
	'/',
	requireAuthentication,
	changemakerProposalsHandlers.getChangemakerProposals,
);

changemakerProposalsRouter.post(
	'/',
	requireAuthentication,
	changemakerProposalsHandlers.postChangemakerProposal,
);

export { changemakerProposalsRouter };
