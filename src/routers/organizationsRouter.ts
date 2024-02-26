import express from 'express';
import { organizationsHandlers } from '../handlers/organizationsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const organizationsRouter = express.Router();

organizationsRouter.get(
	'/',
	verifyAuth,
	organizationsHandlers.getOrganizations,
);

export { organizationsRouter };
