import express from 'express';
import { dataProviderHandlers } from '../handlers/dataProvidersHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const dataProvidersRouter = express.Router();

dataProvidersRouter.get(
	'/',
	requireAuthentication,
	dataProviderHandlers.getDataProviders,
);

dataProvidersRouter.get(
	'/:dataProviderShortCode',
	requireAuthentication,
	dataProviderHandlers.getDataProvider,
);

dataProvidersRouter.put(
	'/:dataProviderShortCode',
	requireAdministratorRole,
	dataProviderHandlers.putDataProvider,
);

export { dataProvidersRouter };
