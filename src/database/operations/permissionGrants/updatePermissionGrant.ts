import { generateUpdateItemOperation } from '../generators';
import type {
	Id,
	PermissionGrant,
	WritablePermissionGrant,
} from '../../../types';

const updatePermissionGrant = generateUpdateItemOperation<
	PermissionGrant,
	WritablePermissionGrant,
	[permissionGrantId: Id]
>(
	'permissionGrants.updateById',
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
	['permissionGrantId'],
);

export { updatePermissionGrant };
