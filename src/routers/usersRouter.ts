import express from 'express';
import { userChangemakerPermissionsHandlers } from '../handlers/userChangemakerPermissionsHandlers';
import { userDataProviderPermissionsHandlers } from '../handlers/userDataProviderPermissionsHandlers';
import { userFunderPermissionsHandlers } from '../handlers/userFunderPermissionsHandlers';
import { userOpportunityPermissionsHandlers } from '../handlers/userOpportunityPermissionsHandlers';
import { userPermissionGrantHandlers } from '../handlers/userPermissionGrantHandlers';
import { usersHandlers } from '../handlers/usersHandlers';
import {
	requireAdministratorRole,
	requireAuthentication,
	requireChangemakerPermission,
	requireDataProviderPermission,
	requireFunderPermission,
} from '../middleware';
import { Permission } from '../types';

const usersRouter = express.Router();

usersRouter.get('/', requireAuthentication, usersHandlers.getUsers);
usersRouter.put(
	'/:userKeycloakUserId/changemakers/:changemakerId/permissions/:permission',
	requireChangemakerPermission(Permission.MANAGE),
	userChangemakerPermissionsHandlers.putUserChangemakerPermission,
);
usersRouter.delete(
	'/:userKeycloakUserId/changemakers/:changemakerId/permissions/:permission',
	requireChangemakerPermission(Permission.MANAGE),
	userChangemakerPermissionsHandlers.deleteUserChangemakerPermission,
);
usersRouter.put(
	'/:userKeycloakUserId/dataProviders/:dataProviderShortCode/permissions/:permission',
	requireDataProviderPermission(Permission.MANAGE),
	userDataProviderPermissionsHandlers.putUserDataProviderPermission,
);
usersRouter.delete(
	'/:userKeycloakUserId/dataProviders/:dataProviderShortCode/permissions/:permission',
	requireDataProviderPermission(Permission.MANAGE),
	userDataProviderPermissionsHandlers.deleteUserDataProviderPermission,
);
usersRouter.put(
	'/:userKeycloakUserId/funders/:funderShortCode/permissions/:permission',
	requireFunderPermission(Permission.MANAGE),
	userFunderPermissionsHandlers.putUserFunderPermission,
);
usersRouter.delete(
	'/:userKeycloakUserId/funders/:funderShortCode/permissions/:permission',
	requireFunderPermission(Permission.MANAGE),
	userFunderPermissionsHandlers.deleteUserFunderPermission,
);
usersRouter.put(
	'/:userKeycloakUserId/opportunities/:opportunityId/permissions/:opportunityPermission',
	requireAdministratorRole,
	userOpportunityPermissionsHandlers.putUserOpportunityPermission,
);
usersRouter.delete(
	'/:userKeycloakUserId/opportunities/:opportunityId/permissions/:opportunityPermission',
	requireAdministratorRole,
	userOpportunityPermissionsHandlers.deleteUserOpportunityPermission,
);

// v2 Permission Grants
usersRouter.get(
	'/:userKeycloakUserId/permissions',
	requireAdministratorRole,
	userPermissionGrantHandlers.getUserPermissionGrants,
);
usersRouter.put(
	'/:userKeycloakUserId/:entityType/:entityPk/permissions/:permissionVerb',
	requireAdministratorRole,
	userPermissionGrantHandlers.putUserPermissionGrant,
);
usersRouter.delete(
	'/:userKeycloakUserId/:entityType/:entityPk/permissions/:permissionVerb',
	requireAdministratorRole,
	userPermissionGrantHandlers.deleteUserPermissionGrant,
);

export { usersRouter };
