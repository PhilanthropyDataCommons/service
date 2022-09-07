import express from 'express';
import { canonicalFieldsHandlers } from '../handlers/canonicalFieldsHandlers';

const canonicalFieldsRouter = express.Router();

canonicalFieldsRouter.get('/', canonicalFieldsHandlers.getCanonicalFields);
canonicalFieldsRouter.post('/', canonicalFieldsHandlers.postCanonicalField);

export { canonicalFieldsRouter };
