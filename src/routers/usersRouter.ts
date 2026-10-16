import express from 'express';
import { usersHandlers } from '../handlers/usersHandlers';
import {
	requireAuthentication,
	requireKeycloakRealmManagementRoles,
} from '../middleware';

// The users walk the sync performs is gated at Keycloak by
// `users.requireQuery()` on the caller's JWT, so the PDC layer admits a
// caller whose JWT carries any one of the roles Keycloak accepts on the
// equivalent `GET /admin/realms/{realm}/users` list call.
const USERS_SYNC_REQUIRED_REALM_MANAGEMENT_ROLES = [
	'query-users',
	'view-users',
	'manage-users',
];

const usersRouter = express.Router();

usersRouter.get('/', requireAuthentication, usersHandlers.getUsers);
usersRouter.post(
	'/sync',
	requireAuthentication,
	requireKeycloakRealmManagementRoles(
		USERS_SYNC_REQUIRED_REALM_MANAGEMENT_ROLES,
	),
	usersHandlers.syncUsersFromKeycloak,
);
usersRouter.get(
	'/sync/:userSyncTaskId',
	requireAuthentication,
	usersHandlers.getUserSyncTask,
);

export { usersRouter };
