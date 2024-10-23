import express from 'express';
import { syncBaseFieldHandlers } from '../handlers/syncBaseFieldsHandlers';
import { requireAdministratorRole } from '../middleware';

const syncBaseFieldsRouter = express.Router();

syncBaseFieldsRouter.post(
	'/',
	requireAdministratorRole,
	syncBaseFieldHandlers.postSyncBaseField,
);

syncBaseFieldsRouter.get(
	'/',
	requireAdministratorRole,
	syncBaseFieldHandlers.getSyncBaseFields,
);

export { syncBaseFieldsRouter };
