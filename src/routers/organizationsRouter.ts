import express from 'express';
import { organizationsHandlers } from '../handlers/organizationsHandlers';
import {
	requireAuthentication,
	requireKeycloakRealmManagementRoles,
} from '../middleware';

const ORGANIZATIONS_SYNC_SUFFICIENT_REALM_MANAGEMENT_ROLE_SETS = [
	['view-organizations', 'manage-organizations', 'manage-realm'],
	['view-users', 'manage-users'],
];

const organizationsRouter = express.Router();

organizationsRouter.get(
	'/',
	requireAuthentication,
	organizationsHandlers.getOrganizations,
);

organizationsRouter.post(
	'/sync',
	requireAuthentication,
	requireKeycloakRealmManagementRoles(
		...ORGANIZATIONS_SYNC_SUFFICIENT_REALM_MANAGEMENT_ROLE_SETS,
	),
	organizationsHandlers.syncOrganizationsFromKeycloak,
);

organizationsRouter.get(
	'/sync/:organizationSyncTaskId',
	requireAuthentication,
	organizationsHandlers.getOrganizationSyncTask,
);

organizationsRouter.get(
	'/:keycloakOrganizationId',
	requireAuthentication,
	organizationsHandlers.getOrganization,
);

export { organizationsRouter };
