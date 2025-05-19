import express from 'express';
import { fundersHandlers } from '../handlers/fundersHandlers';
import { funderCollaborativeMembersHandlers } from '../handlers/funderCollaborativeMembersHandlers';
import { requireAdministratorRole, requireAuthentication, requireFunderPermission } from '../middleware';
import { Permission } from '../types';

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
	funderCollaborativeMembersHandlers.getFunderCollaborativeMembers,
);

fundersRouter.get(
	'/:funderShortCode/members/:memberFunderShortCode',
	requireFunderPermission(Permission.MANAGE),
	funderCollaborativeMembersHandlers.getFunderCollaborativeMember,
);

fundersRouter.post(
	'/:funderShortCode/members/:memberFunderShortCode',
	requireAdministratorRole,
	funderCollaborativeMembersHandlers.postFunderCollaborativeMember,
);

fundersRouter.delete(
	'/:funderShortCode/members/:memberFunderShortCode',
	requireAdministratorRole,
	funderCollaborativeMembersHandlers.deleteFunderCollaborativeMember,
);

export { fundersRouter };
