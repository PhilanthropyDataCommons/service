import express from 'express';
import { canonicalFieldsHandlers } from '../handlers/canonicalFieldsHandlers';
import { checkApiKey as verifyAuth } from '../middleware/apiKeyChecker';

const canonicalFieldsRouter = express.Router();

canonicalFieldsRouter.get('/', verifyAuth, canonicalFieldsHandlers.getCanonicalFields);
canonicalFieldsRouter.post('/', verifyAuth, canonicalFieldsHandlers.postCanonicalField);

export { canonicalFieldsRouter };
