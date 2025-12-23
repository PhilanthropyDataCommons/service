import express from 'express';
import { applicationFormsRouter } from './applicationFormsRouter';
import { applicationFormFieldsRouter } from './applicationFormFieldsRouter';
import { baseFieldsRouter } from './baseFieldsRouter';
import { dataProvidersRouter } from './dataProviderRouter';
import { filesRouter } from './filesRouter';
import { fundersRouter } from './fundersRouter';
import { opportunitiesRouter } from './opportunitiesRouter';
import { organizationsRouter } from './organizationsRouter';
import { changemakersRouter } from './changemakersRouter';
import { changemakerProposalsRouter } from './changemakerProposalsRouter';
import { changemakerFieldValueBatchesRouter } from './changemakerFieldValueBatchesRouter';
import { changemakerFieldValuesRouter } from './changemakerFieldValuesRouter';
import { platformProviderResponsesRouter } from './platformProviderResponsesRouter';
import { proposalsRouter } from './proposalsRouter';
import { proposalVersionsRouter } from './proposalVersionsRouter';
import { sourcesRouter } from './sourcesRouter';
import { tasksRouter } from './tasksRouter';
import { usersRouter } from './usersRouter';
import { documentationRouter } from './documentationRouter';
import { userGroupsRouter } from './userGroupsRouter';

const rootRouter = express.Router();

rootRouter.use('/applicationForms', applicationFormsRouter);
rootRouter.use('/applicationFormFields', applicationFormFieldsRouter);
rootRouter.use('/baseFields', baseFieldsRouter);
rootRouter.use('/tasks', tasksRouter);
rootRouter.use('/changemakers', changemakersRouter);
rootRouter.use('/changemakerProposals', changemakerProposalsRouter);
rootRouter.use(
	'/changemakerFieldValueBatches',
	changemakerFieldValueBatchesRouter,
);
rootRouter.use('/changemakerFieldValues', changemakerFieldValuesRouter);
rootRouter.use('/dataProviders', dataProvidersRouter);
rootRouter.use('/files', filesRouter);
rootRouter.use('/funders', fundersRouter);
rootRouter.use('/opportunities', opportunitiesRouter);
rootRouter.use('/organizations', organizationsRouter);
rootRouter.use('/userGroups', userGroupsRouter);
rootRouter.use('/platformProviderResponses', platformProviderResponsesRouter);
rootRouter.use('/proposals', proposalsRouter);
rootRouter.use('/proposalVersions', proposalVersionsRouter);
rootRouter.use('/sources', sourcesRouter);
rootRouter.use('/users', usersRouter);
rootRouter.use('/', documentationRouter);

export { rootRouter };
