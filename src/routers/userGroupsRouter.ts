import express from 'express';
import { userGroupChangemakerPermissionsHandlers } from '../handlers/userGroupChangemakerPermissionsHandlers';
import { userGroupFunderPermissionsHandlers } from '../handlers/userGroupFunderPermissionsHandlers';
import { userGroupDataProviderPermissionsHandlers } from '../handlers/userGroupDataProviderPermissionsHandlers';
import {
	requireAdministratorRole,
	requireChangemakerPermission,
	requireDataProviderPermission,
	requireFunderPermission,
} from '../middleware';
import { Permission } from '../types';
import { userGroupOpportunityPermissionsHandlers } from '../handlers/userGroupOpportunityPermissionsHandlers';
import { HTTP_STATUS } from '../constants';
import type { Request, Response } from 'express';

const userGroupsRouter = express.Router();

// V2 Permission Grant Stub Handler (501 Not Implemented)
const notImplementedHandler = (_req: Request, res: Response): void => {
	res.status(HTTP_STATUS.SERVER_ERROR.NOT_IMPLEMENTED).json({
		message: 'V2 permission grants not yet implemented',
	});
};

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

// ============================================================================
// V2 Permission Grant Routes (Not Yet Implemented)
// ============================================================================

// List all permissions for a user group
userGroupsRouter.get(
	'/:keycloakOrganizationId/permissions',
	requireAdministratorRole,
	notImplementedHandler,
);

// Funder permissions (shortCode = string)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/funder/:funderShortCode/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/funder/:funderShortCode/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Changemaker permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/changemaker/:changemakerId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/changemaker/:changemakerId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// DataProvider permissions (shortCode = string)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/dataProvider/:dataProviderShortCode/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/dataProvider/:dataProviderShortCode/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Opportunity permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/opportunity/:opportunityId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/opportunity/:opportunityId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Proposal permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/proposal/:proposalId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/proposal/:proposalId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ProposalVersion permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/proposalVersion/:proposalVersionId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/proposalVersion/:proposalVersionId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ApplicationForm permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/applicationForm/:applicationFormId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/applicationForm/:applicationFormId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ApplicationFormField permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/applicationFormField/:applicationFormFieldId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/applicationFormField/:applicationFormFieldId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ProposalFieldValue permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/proposalFieldValue/:proposalFieldValueId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/proposalFieldValue/:proposalFieldValueId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Source permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/source/:sourceId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/source/:sourceId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// BulkUpload permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/bulkUpload/:bulkUploadId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/bulkUpload/:bulkUploadId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Outcome permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/outcome/:outcomeId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/outcome/:outcomeId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ChangemakerFieldValue permissions (id = integer)
userGroupsRouter.put(
	'/:keycloakOrganizationId/permissions/changemakerFieldValue/:changemakerFieldValueId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
userGroupsRouter.delete(
	'/:keycloakOrganizationId/permissions/changemakerFieldValue/:changemakerFieldValueId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

export { userGroupsRouter };
