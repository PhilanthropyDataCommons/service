import express from 'express';
import { fundersHandlers } from '../handlers/fundersHandlers';
import {
	requireAdministratorRole,
	requireAuthentication,
	requireFunderPermission,
} from '../middleware';
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

fundersRouter.post(
	'/:funderShortCode/invitations/sent/:invitedFunderShortCode',
	requireFunderPermission(Permission.MANAGE),
	fundersHandlers.postFunderCollaborativeInvitation,
);

fundersRouter.get(
	'/:funderShortCode/invitations/sent',
	requireFunderPermission(Permission.MANAGE),
	fundersHandlers.getSentFunderCollaborativeInvitations,
);

fundersRouter.get(
	'/:funderShortCode/invitations/received',
	requireFunderPermission(Permission.MANAGE),
	fundersHandlers.getRecievedFunderCollaborativeInvitations,
);

fundersRouter.patch(
	'/:funderShortCode/invitations/received/:invitedFunderShortCode',
	requireFunderPermission(Permission.MANAGE),
	fundersHandlers.patchFunderCollaborativeInvitation,
);
export { fundersRouter };
