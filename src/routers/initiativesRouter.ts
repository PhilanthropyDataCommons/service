import express from 'express';
import { initiativesHandlers } from '../handlers/initiativesHandlers';
import { initiativeFieldValuesHandlers } from '../handlers/initiativeFieldValuesHandlers';
import { requireAuthentication } from '../middleware';

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
	requireAuthentication,
	initiativeFieldValuesHandlers.postInitiativeFieldValue,
);
initiativesRouter.get(
	'/:initiativeId/fieldValues',
	requireAuthentication,
	initiativeFieldValuesHandlers.getInitiativeFieldValues,
);
initiativesRouter.get(
	'/:initiativeId/fieldValues/:fieldValueId',
	requireAuthentication,
	initiativeFieldValuesHandlers.getInitiativeFieldValue,
);
initiativesRouter.patch(
	'/:initiativeId/fieldValues/:fieldValueId',
	requireAuthentication,
	initiativeFieldValuesHandlers.patchInitiativeFieldValue,
);

export { initiativesRouter };
