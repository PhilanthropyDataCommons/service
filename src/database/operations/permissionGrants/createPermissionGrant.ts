import { generateCreateItemOperation } from '../generators';
import type { PermissionGrant, WritablePermissionGrant } from '../../../types';

const createPermissionGrant = generateCreateItemOperation<
	PermissionGrant,
	WritablePermissionGrant,
	[]
>(
	'permissionGrants.insertOne',
	[
		'granteeType',
		'granteeUserKeycloakUserId',
		'granteeKeycloakOrganizationId',
		'contextEntityType',
		'changemakerId',
		'funderShortCode',
		'dataProviderShortCode',
		'opportunityId',
		'proposalId',
		'proposalVersionId',
		'applicationFormId',
		'applicationFormFieldId',
		'proposalFieldValueId',
		'sourceId',
		'bulkUploadTaskId',
		'changemakerFieldValueId',
		'terminologySetId',
		'scope',
		'verbs',
		'conditions',
	],
	[],
);

export { createPermissionGrant };
