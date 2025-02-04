import express from 'express';
import { userGroupChangemakerPermissionsHandlers } from '../handlers/userGroupChangemakerPermissionsHandlers';
import { userGroupDataProviderPermissionsHandlers } from '../handlers/userGroupDataProviderPermissionsHandlers';
import {
	requireChangemakerPermission,
	requireDataProviderPermission,
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
userGroupsRouter.put(
	'/:keycloakOrganizationId/dataProviders/:dataProviderShortCode/permissions/:permission',
	requireDataProviderPermission(Permission.MANAGE),
	userGroupDataProviderPermissionsHandlers.putUserGroupDataProviderPermission,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/dataProviders/:dataProviderShortCode/permissions/:permission',
	requireDataProviderPermission(Permission.MANAGE),
	userGroupDataProviderPermissionsHandlers.deleteUserGroupDataProviderPermission,
);
export { userGroupsRouter };
