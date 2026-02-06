import express from 'express';
import { userGroupDataProviderPermissionsHandlers } from '../handlers/userGroupDataProviderPermissionsHandlers';
import { userGroupOpportunityPermissionsHandlers } from '../handlers/userGroupOpportunityPermissionsHandlers';
import {
	requireAdministratorRole,
	requireDataProviderPermission,
} from '../middleware';
import { Permission } from '../types';

const userGroupsRouter = express.Router();

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
userGroupsRouter.put(
	'/:keycloakOrganizationId/opportunities/:opportunityId/permissions/:opportunityPermission',
	requireAdministratorRole,
	userGroupOpportunityPermissionsHandlers.putUserGroupOpportunityPermission,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/opportunities/:opportunityId/permissions/:opportunityPermission',
	requireAdministratorRole,
	userGroupOpportunityPermissionsHandlers.deleteUserGroupOpportunityPermission,
);

export { userGroupsRouter };
