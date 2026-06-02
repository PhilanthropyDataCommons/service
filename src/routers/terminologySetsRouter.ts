import express from 'express';
import { terminologySetsHandlers } from '../handlers/terminologySetsHandlers';
import { requireAuthentication } from '../middleware';

const terminologySetsRouter = express.Router();

terminologySetsRouter.post(
	'/',
	requireAuthentication,
	terminologySetsHandlers.postTerminologySet,
);
terminologySetsRouter.get(
	'/',
	requireAuthentication,
	terminologySetsHandlers.getTerminologySets,
);
terminologySetsRouter.get(
	'/:terminologySetId',
	requireAuthentication,
	terminologySetsHandlers.getTerminologySet,
);
terminologySetsRouter.patch(
	'/:terminologySetId',
	requireAuthentication,
	terminologySetsHandlers.patchTerminologySet,
);

export { terminologySetsRouter };
