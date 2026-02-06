import express from 'express';
import { userGroupOpportunityPermissionsHandlers } from '../handlers/userGroupOpportunityPermissionsHandlers';
import { requireAdministratorRole } from '../middleware';

const userGroupsRouter = express.Router();

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
