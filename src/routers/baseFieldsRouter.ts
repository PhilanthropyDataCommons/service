import express from 'express';
import { baseFieldsHandlers } from '../handlers/baseFieldsHandlers';
import { requireAdministratorRole } from '../middleware';

const baseFieldsRouter = express.Router();

baseFieldsRouter.get('/', baseFieldsHandlers.getBaseFields);
baseFieldsRouter.post(
	'/',
	requireAdministratorRole,
	baseFieldsHandlers.postBaseField,
);
baseFieldsRouter.put(
	'/:baseFieldId',
	requireAdministratorRole,
	baseFieldsHandlers.putBaseField,
);
baseFieldsRouter.get(
	'/:baseFieldId/localizations',
	baseFieldsHandlers.getBaseFieldLocalizationsByBaseFieldId,
);
baseFieldsRouter.put(
	'/:baseFieldId/localizations/:language',
	requireAdministratorRole,
	baseFieldsHandlers.putBaseFieldLocalization,
);

export { baseFieldsRouter };
