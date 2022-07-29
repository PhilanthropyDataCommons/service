import express from 'express';
import { canonicalFieldsRouter } from './canonicalFieldsRouter';
import { opportunitiesRouter } from './opportunitiesRouter';

const rootRouter = express.Router();

rootRouter.use('/canonicalFields', canonicalFieldsRouter);
rootRouter.use('/opportunities', opportunitiesRouter);

export { rootRouter };
