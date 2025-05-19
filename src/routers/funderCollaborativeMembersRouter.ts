import express from 'express';
import { funderCollaborativeMembersHandlers } from '../handlers/funderCollaborativeMembersHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const funderCollaborativeMembersRouter = express.Router();

funderCollaborativeMembersRouter.get(
	'/',
	requireAuthentication,
	funderCollaborativeMembersHandlers.getFunderCollaborativeMembers,
);

funderCollaborativeMembersRouter.get(
	'/:funderCollaborativeShortCode/:memberShortCode',
	requireAuthentication,
	funderCollaborativeMembersHandlers.getFunderCollaborativeMember,
);

funderCollaborativeMembersRouter.post(
	'/:funderCollaborativeShortCode/:memberShortCode',
	requireAdministratorRole,
	funderCollaborativeMembersHandlers.postFunderCollaborativeMember,
);

funderCollaborativeMembersRouter.delete(
	'/:funderCollaborativeShortCode/:memberShortCode',
	requireAdministratorRole,
	funderCollaborativeMembersHandlers.deleteFunderCollaborativeMember,
);

export { funderCollaborativeMembersRouter };
