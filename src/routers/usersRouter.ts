import express from 'express';
import { userChangemakerPermissionsHandlers } from '../handlers/userChangemakerPermissionsHandlers';
import { usersHandlers } from '../handlers/usersHandlers';
import {
	requireAdministratorRole,
	requireAuthentication,
	requireChangemakerPermission,
	requireDataProviderPermission,
	requireFunderPermission,
} from '../middleware';
import { Permission } from '../types';
import { userFunderPermissionsHandlers } from '../handlers/userFunderPermissionsHandlers';
import { userDataProviderPermissionsHandlers } from '../handlers/userDataProviderPermissionsHandlers';
import { userOpportunityPermissionsHandlers } from '../handlers/userOpportunityPermissionsHandlers';
import { HTTP_STATUS } from '../constants';
import type { Request, Response } from 'express';

const usersRouter = express.Router();

// V2 Permission Grant Stub Handler (501 Not Implemented)
const notImplementedHandler = (_req: Request, res: Response): void => {
	res.status(HTTP_STATUS.SERVER_ERROR.NOT_IMPLEMENTED).json({
		message: 'V2 permission grants not yet implemented',
	});
};

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

// ============================================================================
// V2 Permission Grant Routes (Not Yet Implemented)
// ============================================================================

// List all permissions for a user
usersRouter.get(
	'/:userKeycloakUserId/permissions',
	requireAdministratorRole,
	notImplementedHandler,
);

// Funder permissions (shortCode = string)
usersRouter.put(
	'/:userKeycloakUserId/permissions/funder/:funderShortCode/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/funder/:funderShortCode/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Changemaker permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/changemaker/:changemakerId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/changemaker/:changemakerId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// DataProvider permissions (shortCode = string)
usersRouter.put(
	'/:userKeycloakUserId/permissions/dataProvider/:dataProviderShortCode/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/dataProvider/:dataProviderShortCode/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Opportunity permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/opportunity/:opportunityId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/opportunity/:opportunityId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Proposal permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/proposal/:proposalId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/proposal/:proposalId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ProposalVersion permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/proposalVersion/:proposalVersionId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/proposalVersion/:proposalVersionId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ApplicationForm permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/applicationForm/:applicationFormId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/applicationForm/:applicationFormId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ApplicationFormField permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/applicationFormField/:applicationFormFieldId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/applicationFormField/:applicationFormFieldId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ProposalFieldValue permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/proposalFieldValue/:proposalFieldValueId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/proposalFieldValue/:proposalFieldValueId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Source permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/source/:sourceId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/source/:sourceId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// BulkUpload permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/bulkUpload/:bulkUploadId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/bulkUpload/:bulkUploadId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// Outcome permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/outcome/:outcomeId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/outcome/:outcomeId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

// ChangemakerFieldValue permissions (id = integer)
usersRouter.put(
	'/:userKeycloakUserId/permissions/changemakerFieldValue/:changemakerFieldValueId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);
usersRouter.delete(
	'/:userKeycloakUserId/permissions/changemakerFieldValue/:changemakerFieldValueId(\\d+)/:permissionVerb',
	requireAdministratorRole,
	notImplementedHandler,
);

export { usersRouter };
