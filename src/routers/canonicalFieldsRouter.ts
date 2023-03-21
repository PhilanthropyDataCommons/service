import express from 'express';
import { canonicalFieldsHandlers } from '../handlers/canonicalFieldsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const canonicalFieldsRouter = express.Router();

canonicalFieldsRouter.get('/', verifyAuth, canonicalFieldsHandlers.getCanonicalFields);
canonicalFieldsRouter.post('/', verifyAuth, canonicalFieldsHandlers.postCanonicalField);

export { canonicalFieldsRouter };
