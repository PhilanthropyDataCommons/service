import express from 'express';
import { organizationDetailHandlers } from '../handlers/organizationDetailHandlers';
import { requireAuthentication } from '../middleware';

const organizationDetailRouter = express.Router();

organizationDetailRouter.get(
	'/:organizationId',
	requireAuthentication,
	organizationDetailHandlers.getOrganizationDetail,
);

export { organizationDetailRouter };
