import express from 'express';
import { initiativesHandlers } from '../handlers/initiativesHandlers';
import { requireAdministratorRole } from '../middleware';

const initiativesRouter = express.Router();

initiativesRouter.post(
	'/',
	requireAdministratorRole,
	initiativesHandlers.postInitiative,
);
initiativesRouter.get(
	'/',
	requireAdministratorRole,
	initiativesHandlers.getInitiatives,
);
initiativesRouter.get(
	'/:initiativeId',
	requireAdministratorRole,
	initiativesHandlers.getInitiative,
);
initiativesRouter.patch(
	'/:initiativeId',
	requireAdministratorRole,
	initiativesHandlers.patchInitiative,
);

export { initiativesRouter };
