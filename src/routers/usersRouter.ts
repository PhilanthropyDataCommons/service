import express from 'express';
import { usersHandlers } from '../handlers/usersHandlers';
import {
	requireAuthentication,
	requireKeycloakRealmManagementRoles,
} from '../middleware';

// The sync infers deletion from absence in the user listing, so the
// caller must hold realm-wide visibility: query-users alone receives
// scope-filtered listings, while view-users and manage-users do not.
const USERS_SYNC_SUFFICIENT_REALM_MANAGEMENT_ROLES = [
	'view-users',
	'manage-users',
];

const usersRouter = express.Router();

usersRouter.get('/', requireAuthentication, usersHandlers.getUsers);
usersRouter.post(
	'/sync',
	requireAuthentication,
	requireKeycloakRealmManagementRoles(
		USERS_SYNC_SUFFICIENT_REALM_MANAGEMENT_ROLES,
	),
	usersHandlers.syncUsersFromKeycloak,
);
usersRouter.get(
	'/sync/:userSyncTaskId',
	requireAuthentication,
	usersHandlers.getUserSyncTask,
);

export { usersRouter };
