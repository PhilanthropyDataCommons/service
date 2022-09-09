import express from 'express';
import { applicantsRouter } from './applicantsRouter';
import { canonicalFieldsRouter } from './canonicalFieldsRouter';
import { opportunitiesRouter } from './opportunitiesRouter';
import { documentationRouter } from './documentationRouter';

const rootRouter = express.Router();

rootRouter.use('/applicants', applicantsRouter);
rootRouter.use('/canonicalFields', canonicalFieldsRouter);
rootRouter.use('/opportunities', opportunitiesRouter);
rootRouter.use('/', documentationRouter);

export { rootRouter };
