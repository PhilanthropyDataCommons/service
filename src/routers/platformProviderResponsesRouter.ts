import express from 'express';
import { platformProviderResponsesHandlers } from '../handlers/platformProviderResponsesHandlers';
import { requireAuthentication } from '../middleware';

const platformProviderResponsesRouter = express.Router();

platformProviderResponsesRouter.get(
	'/',
	requireAuthentication,
	platformProviderResponsesHandlers.getPlatformProviderResponsesByExternalId,
);
platformProviderResponsesRouter.post(
	'/',
	requireAuthentication,
	platformProviderResponsesHandlers.postPlatformProviderResponse,
);

export { platformProviderResponsesRouter };
