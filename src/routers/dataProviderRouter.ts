import express from 'express';
import { dataProviderHandlers } from '../handlers/dataProviderHandlers';
import { requireAuthentication } from '../middleware';

const dataProvidersRouter = express.Router();

dataProvidersRouter.post(
	'/',
	requireAuthentication,
	dataProviderHandlers.postDataProvider,
);

dataProvidersRouter.get(
	'/',
	requireAuthentication,
	dataProviderHandlers.getDataProviders,
);
dataProvidersRouter.get(
	'/:dataProviderId',
	requireAuthentication,
	dataProviderHandlers.getDataProvider,
);

export { dataProvidersRouter };
