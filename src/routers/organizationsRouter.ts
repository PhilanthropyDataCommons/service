import express from 'express';
import { organizationsHandlers } from '../handlers/organizationsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const organizationsRouter = express.Router();

organizationsRouter.get(
	'/',
	verifyAuth,
	organizationsHandlers.getOrganizations,
);

organizationsRouter.get(
	'/:id',
	verifyAuth,
	organizationsHandlers.getOrganization,
);

export { organizationsRouter };
