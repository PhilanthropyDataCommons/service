import express from 'express';
import { organizationProposalsHandlers } from '../handlers/organizationProposalsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const organizationProposalsRouter = express.Router();

organizationProposalsRouter.get(
	'/',
	verifyAuth,
	organizationProposalsHandlers.getOrganizationProposals,
);

organizationProposalsRouter.post(
	'/',
	verifyAuth,
	organizationProposalsHandlers.postOrganizationProposal,
);

export { organizationProposalsRouter };
