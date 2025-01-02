import express from 'express';
import { userChangemakerPermissionsHandlers } from '../handlers/userChangemakerPermissionsHandlers';
import { usersHandlers } from '../handlers/usersHandlers';
import {
	requireAuthentication,
	requireChangemakerPermission,
	requireDataProviderPermission,
	requireFunderPermission,
} from '../middleware';
import { Permission } from '../types';
import { userFunderPermissionsHandlers } from '../handlers/userFunderPermissionsHandlers';
import { userDataProviderPermissionsHandlers } from '../handlers/userDataProviderPermissionsHandlers';

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

export { usersRouter };
