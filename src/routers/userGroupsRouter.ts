import express from 'express';
import { userGroupChangemakerPermissionsHandlers } from '../handlers/userGroupChangemakerPermissionsHandlers';
import {
	requireChangemakerPermission,
} from '../middleware';
import { Permission } from '../types';

const userGroupsRouter = express.Router();

userGroupsRouter.put(
	'/:keycloakOrganizationId/changemakers/:changemakerId/permissions/:permission',
	requireChangemakerPermission(Permission.MANAGE),
	userGroupChangemakerPermissionsHandlers.putUserGroupChangemakerPermission,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/changemakers/:changemakerId/permissions/:permission',
	requireChangemakerPermission(Permission.MANAGE),
	userGroupChangemakerPermissionsHandlers.deleteUserGroupChangemakerPermission,
);

export { userGroupsRouter };
