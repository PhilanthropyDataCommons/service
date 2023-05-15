import express from 'express';
import { applicantsRouter } from './applicantsRouter';
import { applicationFormsRouter } from './applicationFormsRouter';
import { baseFieldsRouter } from './baseFieldsRouter';
import { opportunitiesRouter } from './opportunitiesRouter';
import { proposalsRouter } from './proposalsRouter';
import { proposalVersionsRouter } from './proposalVersionsRouter';
import { documentationRouter } from './documentationRouter';

const rootRouter = express.Router();

rootRouter.use('/applicants', applicantsRouter);
rootRouter.use('/applicationForms', applicationFormsRouter);
rootRouter.use('/baseFields', baseFieldsRouter);
rootRouter.use('/opportunities', opportunitiesRouter);
rootRouter.use('/proposals', proposalsRouter);
rootRouter.use('/proposalVersions', proposalVersionsRouter);
rootRouter.use('/', documentationRouter);

export { rootRouter };
