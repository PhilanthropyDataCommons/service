import express from 'express';
import { canonicalFieldsRouter } from './canonicalFieldsRouter';

const rootRouter = express.Router();

rootRouter.use('/canonicalFields', canonicalFieldsRouter);

export { rootRouter };
