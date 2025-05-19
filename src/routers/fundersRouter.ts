import express from 'express';
import { fundersHandlers } from '../handlers/fundersHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const fundersRouter = express.Router();

fundersRouter.get('/', requireAuthentication, fundersHandlers.getFunders);

fundersRouter.get(
	'/:funderShortCode',
	requireAuthentication,
	fundersHandlers.getFunder,
);

fundersRouter.put(
	'/:funderShortCode',
	requireAdministratorRole,
	fundersHandlers.putFunder,
);

fundersRouter.get(
	'/:funderShortCode/members',
	requireFunderPermission(Permission.MANAGE),
	fundersHandlers.getFunderCollaborativeMembers,
);

fundersRouter.get(
	'/:funderShortCode/members/:memberFunderShortCode',
	requireFunderPermission(Permission.MANAGE),
	fundersHandlers.getFunderCollaborativeMember,
);

fundersRouter.post(
	'/:funderShortCode/members/:memberFunderShortCode',
	requireAdministratorRole,
	fundersHandlers.postFunderCollaborativeMember,
);

fundersRouter.delete(
	'/:funderShortCode/members/:memberFunderShortCode',
	requireAdministratorRole,
	fundersHandlers.deleteFunderCollaborativeMember,
);

export { fundersRouter };
