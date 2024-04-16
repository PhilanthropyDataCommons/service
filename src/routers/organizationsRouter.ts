import express from 'express';
import { organizationsHandlers } from '../handlers/organizationsHandlers';
import { requireAuthentication } from '../middleware';

const organizationsRouter = express.Router();

organizationsRouter.get('/', organizationsHandlers.getOrganizations);

organizationsRouter.get(
	'/:organizationId',
	organizationsHandlers.getOrganization,
);

organizationsRouter.post(
	'/',
	requireAuthentication,
	organizationsHandlers.postOrganization,
);

export { organizationsRouter };
