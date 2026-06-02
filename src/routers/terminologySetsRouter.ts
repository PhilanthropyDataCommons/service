import express from 'express';
import { terminologySetsHandlers } from '../handlers/terminologySetsHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const terminologySetsRouter = express.Router();

terminologySetsRouter.post(
	'/',
	requireAuthentication,
	requireAdministratorRole,
	terminologySetsHandlers.postTerminologySet,
);
terminologySetsRouter.get(
	'/',
	requireAuthentication,
	requireAdministratorRole,
	terminologySetsHandlers.getTerminologySets,
);
terminologySetsRouter.get(
	'/:terminologySetId',
	requireAuthentication,
	requireAdministratorRole,
	terminologySetsHandlers.getTerminologySet,
);
terminologySetsRouter.patch(
	'/:terminologySetId',
	requireAuthentication,
	requireAdministratorRole,
	terminologySetsHandlers.patchTerminologySet,
);

export { terminologySetsRouter };
