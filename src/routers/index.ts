import express from 'express';
import { applicationFormsRouter } from './applicationFormsRouter';
import { baseFieldsRouter } from './baseFieldsRouter';
import { bulkUploadsRouter } from './bulkUploadsRouter';
import { opportunitiesRouter } from './opportunitiesRouter';
import { organizationsRouter } from './organizationsRouter';
import { organizationDetailRouter } from './organizationDetailRouter';
import { organizationProposalsRouter } from './organizationProposalsRouter';
import { platformProviderResponsesRouter } from './platformProviderResponsesRouter';
import { presignedPostRequestsRouter } from './presignedPostRequestsRouter';
import { proposalsRouter } from './proposalsRouter';
import { proposalVersionsRouter } from './proposalVersionsRouter';
import { usersRouter } from './usersRouter';
import { documentationRouter } from './documentationRouter';

const rootRouter = express.Router();

rootRouter.use('/applicationForms', applicationFormsRouter);
rootRouter.use('/baseFields', baseFieldsRouter);
rootRouter.use('/bulkUploads', bulkUploadsRouter);
rootRouter.use('/opportunities', opportunitiesRouter);
rootRouter.use('/organizations', organizationsRouter);
rootRouter.use('/organizationDetail', organizationDetailRouter);
rootRouter.use('/organizationProposals', organizationProposalsRouter);
rootRouter.use('/platformProviderResponses', platformProviderResponsesRouter);
rootRouter.use('/presignedPostRequests', presignedPostRequestsRouter);
rootRouter.use('/proposals', proposalsRouter);
rootRouter.use('/proposalVersions', proposalVersionsRouter);
rootRouter.use('/users', usersRouter);
rootRouter.use('/', documentationRouter);

export { rootRouter };
