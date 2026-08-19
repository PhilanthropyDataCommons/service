import express from 'express';
import { initiativesHandlers } from '../handlers/initiativesHandlers';
import { initiativeFieldValuesHandlers } from '../handlers/initiativeFieldValuesHandlers';
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
