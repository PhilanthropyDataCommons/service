import express from 'express';
import { userChangemakerPermissionsHandlers } from '../handlers/userChangemakerPermissionsHandlers';
import { usersHandlers } from '../handlers/usersHandlers';
import {
	requireAuthentication,
	requireChangemakerPermission,
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

export { usersRouter };
