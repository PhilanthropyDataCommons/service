import express from 'express';
import { canonicalFieldsHandlers } from '../handlers/canonicalFieldsHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const canonicalFieldsRouter = express.Router();

canonicalFieldsRouter.get('/', checkApiKey, canonicalFieldsHandlers.getCanonicalFields);
canonicalFieldsRouter.post('/', checkApiKey, canonicalFieldsHandlers.postCanonicalField);

export { canonicalFieldsRouter };
