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
	'/:organizationId',
	requireAuthentication,
	organizationsHandlers.getOrganization,
);

organizationsRouter.post(
	'/',
	requireAuthentication,
	organizationsHandlers.postOrganization,
);

export { organizationsRouter };
