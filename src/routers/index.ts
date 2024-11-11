import express from 'express';
import { applicationFormsRouter } from './applicationFormsRouter';
import { baseFieldsRouter } from './baseFieldsRouter';
import { dataProvidersRouter } from './dataProviderRouter';
import { fundersRouter } from './fundersRouter';
import { opportunitiesRouter } from './opportunitiesRouter';
import { changemakersRouter } from './changemakersRouter';
import { changemakerProposalsRouter } from './changemakerProposalsRouter';
import { platformProviderResponsesRouter } from './platformProviderResponsesRouter';
import { presignedPostRequestsRouter } from './presignedPostRequestsRouter';
import { proposalsRouter } from './proposalsRouter';
import { proposalVersionsRouter } from './proposalVersionsRouter';
import { sourcesRouter } from './sourcesRouter';
import { tasksRouter } from './tasksRouter';
import { usersRouter } from './usersRouter';
import { documentationRouter } from './documentationRouter';

const rootRouter = express.Router();

rootRouter.use('/applicationForms', applicationFormsRouter);
rootRouter.use('/baseFields', baseFieldsRouter);
rootRouter.use('/tasks', tasksRouter);
rootRouter.use('/changemakers', changemakersRouter);
rootRouter.use('/changemakerProposals', changemakerProposalsRouter);
rootRouter.use('/dataProviders', dataProvidersRouter);
rootRouter.use('/funders', fundersRouter);
rootRouter.use('/opportunities', opportunitiesRouter);
rootRouter.use('/platformProviderResponses', platformProviderResponsesRouter);
rootRouter.use('/presignedPostRequests', presignedPostRequestsRouter);
rootRouter.use('/proposals', proposalsRouter);
rootRouter.use('/proposalVersions', proposalVersionsRouter);
rootRouter.use('/sources', sourcesRouter);
rootRouter.use('/users', usersRouter);
rootRouter.use('/', documentationRouter);

export { rootRouter };
