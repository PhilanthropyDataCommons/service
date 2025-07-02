import express from 'express';
import { fundersHandlers } from '../handlers/fundersHandlers';
import { funderCollaborativeMembersHandlers } from '../handlers/funderCollaborativeMembersHandlers';
import { funderCollaborativeInvitationsHandlers } from '../handlers/funderCollaborativeInvitationsHandlers';
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

fundersRouter.post(
	'/:funderShortCode/invitations/sent/:invitedFunderShortCode',
	requireFunderPermission(Permission.MANAGE),
	funderCollaborativeInvitationsHandlers.postFunderCollaborativeInvitation,
);

fundersRouter.get(
	'/:funderShortCode/invitations/sent',
	requireFunderPermission(Permission.MANAGE),
	funderCollaborativeInvitationsHandlers.getSentFunderCollaborativeInvitations,
);

fundersRouter.get(
	'/:funderShortCode/invitations/received',
	requireFunderPermission(Permission.MANAGE),
	funderCollaborativeInvitationsHandlers.getRecievedFunderCollaborativeInvitations,
);

fundersRouter.patch(
	'/:funderShortCode/invitations/received/:invitedFunderShortCode',
	requireFunderPermission(Permission.MANAGE),
	funderCollaborativeInvitationsHandlers.patchFunderCollaborativeInvitation,
);
export { fundersRouter };
