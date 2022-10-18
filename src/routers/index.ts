import express from 'express';
import { applicantsRouter } from './applicantsRouter';
import { applicationFormsRouter } from './applicationFormsRouter';
import { canonicalFieldsRouter } from './canonicalFieldsRouter';
import { opportunitiesRouter } from './opportunitiesRouter';
import { proposalsRouter } from './proposalsRouter';
import { documentationRouter } from './documentationRouter';

const rootRouter = express.Router();

rootRouter.use('/applicants', applicantsRouter);
rootRouter.use('/applicationForms', applicationFormsRouter);
rootRouter.use('/canonicalFields', canonicalFieldsRouter);
rootRouter.use('/opportunities', opportunitiesRouter);
rootRouter.use('/proposals', proposalsRouter);
rootRouter.use('/', documentationRouter);

export { rootRouter };
