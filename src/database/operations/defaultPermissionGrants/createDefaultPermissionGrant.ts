import { generateCreateItemOperation } from '../generators';
import type {
	DefaultPermissionGrant,
	WritableDefaultPermissionGrant,
} from '../../../types';

const createDefaultPermissionGrant = generateCreateItemOperation<
	DefaultPermissionGrant,
	WritableDefaultPermissionGrant,
	[]
>(
	'defaultPermissionGrants.insertOne',
	[
		'granteeType',
		'granteeUserKeycloakUserId',
		'granteeKeycloakOrganizationId',
		'contextEntityType',
		'scope',
		'verbs',
		'conditions',
	],
	[],
);

export { createDefaultPermissionGrant };
