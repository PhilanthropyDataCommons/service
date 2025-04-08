import express from 'express';
import { baseFieldsHandlers } from '../handlers/baseFieldsHandlers';
import { requireAdministratorRole } from '../middleware';

const baseFieldsRouter = express.Router();

baseFieldsRouter.get('/', baseFieldsHandlers.getBaseFields);
baseFieldsRouter.put(
	'/:baseFieldShortCode',
	requireAdministratorRole,
	baseFieldsHandlers.putBaseField,
);
baseFieldsRouter.get(
	'/:baseFieldShortCode/localizations',
	baseFieldsHandlers.getBaseFieldLocalizationsByBaseFieldShortCode,
);
baseFieldsRouter.put(
	'/:baseFieldShortCode/localizations/:language',
	requireAdministratorRole,
	baseFieldsHandlers.putBaseFieldLocalization,
);

export { baseFieldsRouter };
