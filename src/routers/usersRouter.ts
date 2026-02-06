import express from 'express';
import { userDataProviderPermissionsHandlers } from '../handlers/userDataProviderPermissionsHandlers';
import { userOpportunityPermissionsHandlers } from '../handlers/userOpportunityPermissionsHandlers';
import { usersHandlers } from '../handlers/usersHandlers';
import {
	requireAdministratorRole,
	requireAuthentication,
	requireDataProviderPermission,
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
