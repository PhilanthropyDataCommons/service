import express from 'express';
import { platformProviderResponsesHandlers } from '../handlers/platformProviderResponsesHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const platformProviderResponsesRouter = express.Router();

platformProviderResponsesRouter.get(
  '/',
  verifyAuth,
  platformProviderResponsesHandlers.getPlatformProviderResponsesByExternalId,
);
platformProviderResponsesRouter.post(
  '/',
  verifyAuth,
  platformProviderResponsesHandlers.postPlatformProviderResponse,
);

export { platformProviderResponsesRouter };
