import express from 'express';
import { userGroupChangemakerPermissionsHandlers } from '../handlers/userGroupChangemakerPermissionsHandlers';
import { userGroupDataProviderPermissionsHandlers } from '../handlers/userGroupDataProviderPermissionsHandlers';
import { userGroupFunderPermissionsHandlers } from '../handlers/userGroupFunderPermissionsHandlers';
import { userGroupOpportunityPermissionsHandlers } from '../handlers/userGroupOpportunityPermissionsHandlers';
import {
	requireAdministratorRole,
	requireChangemakerPermission,
	requireDataProviderPermission,
	requireFunderPermission,
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
userGroupsRouter.put(
	'/:keycloakOrganizationId/funders/:funderShortCode/permissions/:permission',
	requireFunderPermission(Permission.MANAGE),
	userGroupFunderPermissionsHandlers.putUserGroupFunderPermission,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/funders/:funderShortCode/permissions/:permission',
	requireFunderPermission(Permission.MANAGE),
	userGroupFunderPermissionsHandlers.deleteUserGroupFunderPermission,
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
