import express from 'express';
import { canonicalFieldsHandlers } from '../handlers/canonicalFieldsHandlers';

const canonicalFieldsRouter = express.Router();

canonicalFieldsRouter.use('/', canonicalFieldsHandlers.getCanonicalFields);

export { canonicalFieldsRouter };
