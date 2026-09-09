import { generateUpdateItemOperation } from '../generators';
import type {
	DefaultPermissionGrant,
	Id,
	WritableDefaultPermissionGrant,
} from '../../../types';

const updateDefaultPermissionGrant = generateUpdateItemOperation<
	DefaultPermissionGrant,
	WritableDefaultPermissionGrant,
	[defaultPermissionGrantId: Id]
>(
	'defaultPermissionGrants.updateById',
	[
		'granteeType',
		'granteeUserKeycloakUserId',
		'granteeKeycloakOrganizationId',
		'contextEntityType',
		'scope',
		'verbs',
		'conditions',
	],
	['defaultPermissionGrantId'],
);

export { updateDefaultPermissionGrant };
