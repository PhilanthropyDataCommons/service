import express from 'express';
import { organizationProposalsHandlers } from '../handlers/organizationProposalsHandlers';
import { requireAuthentication } from '../middleware';

const organizationProposalsRouter = express.Router();

organizationProposalsRouter.get(
	'/',
	requireAuthentication,
	organizationProposalsHandlers.getOrganizationProposals,
);

organizationProposalsRouter.post(
	'/',
	requireAuthentication,
	organizationProposalsHandlers.postOrganizationProposal,
);

export { organizationProposalsRouter };
