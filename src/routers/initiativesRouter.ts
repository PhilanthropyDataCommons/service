import express from 'express';
import { initiativesHandlers } from '../handlers/initiativesHandlers';
import { initiativeFieldValuesHandlers } from '../handlers/initiativeFieldValuesHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const initiativesRouter = express.Router();

initiativesRouter.post(
	'/',
	requireAuthentication,
	initiativesHandlers.postInitiative,
);
initiativesRouter.get(
	'/',
	requireAuthentication,
	initiativesHandlers.getInitiatives,
);
initiativesRouter.get(
	'/:initiativeId',
	requireAuthentication,
	initiativesHandlers.getInitiative,
);
initiativesRouter.patch(
	'/:initiativeId',
	requireAuthentication,
	initiativesHandlers.patchInitiative,
);
initiativesRouter.post(
	'/:initiativeId/fieldValues',
	requireAdministratorRole,
	initiativeFieldValuesHandlers.postInitiativeFieldValue,
);
initiativesRouter.get(
	'/:initiativeId/fieldValues',
	requireAdministratorRole,
	initiativeFieldValuesHandlers.getInitiativeFieldValues,
);
initiativesRouter.get(
	'/:initiativeId/fieldValues/:fieldValueId',
	requireAdministratorRole,
	initiativeFieldValuesHandlers.getInitiativeFieldValue,
);
initiativesRouter.patch(
	'/:initiativeId/fieldValues/:fieldValueId',
	requireAdministratorRole,
	initiativeFieldValuesHandlers.patchInitiativeFieldValue,
);

export { initiativesRouter };
