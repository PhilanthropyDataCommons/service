import express from 'express';
import { fundersHandlers } from '../handlers/fundersHandlers';
import { funderCollaborativeMembersHandlers } from '../handlers/funderCollaborativeMembersHandlers';
import { funderCollaborativeInvitationsHandlers } from '../handlers/funderCollaborativeInvitationsHandlers';
import {
	requireAdministratorRole,
	requireAuthentication,
	requireFunderPermission,
} from '../middleware';
import { PermissionGrantVerb } from '../types';

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
	requireFunderPermission(PermissionGrantVerb.MANAGE),
	funderCollaborativeMembersHandlers.getFunderCollaborativeMembers,
);

fundersRouter.get(
	'/:funderShortCode/members/:memberFunderShortCode',
	requireFunderPermission(PermissionGrantVerb.MANAGE),
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
	requireFunderPermission(PermissionGrantVerb.MANAGE),
	funderCollaborativeInvitationsHandlers.postFunderCollaborativeInvitation,
);

fundersRouter.get(
	'/:funderShortCode/invitations/sent',
	requireFunderPermission(PermissionGrantVerb.MANAGE),
	funderCollaborativeInvitationsHandlers.getSentFunderCollaborativeInvitations,
);

fundersRouter.get(
	'/:funderShortCode/invitations/received',
	requireFunderPermission(PermissionGrantVerb.MANAGE),
	funderCollaborativeInvitationsHandlers.getRecievedFunderCollaborativeInvitations,
);

fundersRouter.patch(
	'/:funderShortCode/invitations/received/:invitedFunderShortCode',
	requireFunderPermission(PermissionGrantVerb.MANAGE),
	funderCollaborativeInvitationsHandlers.patchFunderCollaborativeInvitation,
);
export { fundersRouter };
