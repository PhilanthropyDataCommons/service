import express from 'express';
import { userDataProviderPermissionsHandlers } from '../handlers/userDataProviderPermissionsHandlers';
import { userFunderPermissionsHandlers } from '../handlers/userFunderPermissionsHandlers';
import { userOpportunityPermissionsHandlers } from '../handlers/userOpportunityPermissionsHandlers';
import { usersHandlers } from '../handlers/usersHandlers';
import {
	requireAdministratorRole,
	requireAuthentication,
	requireDataProviderPermission,
	requireFunderPermission,
} from '../middleware';
import { Permission } from '../types';

const usersRouter = express.Router();

usersRouter.get('/', requireAuthentication, usersHandlers.getUsers);
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

export { usersRouter };
