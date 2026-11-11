import express from 'express';
import { organizationsHandlers } from '../handlers/organizationsHandlers';
import { requireAuthentication } from '../middleware';

const organizationsRouter = express.Router();

organizationsRouter.get(
	'/',
	requireAuthentication,
	organizationsHandlers.getOrganizations,
);

organizationsRouter.get(
	'/:keycloakOrganizationId',
	requireAuthentication,
	organizationsHandlers.getOrganization,
);

export { organizationsRouter };
