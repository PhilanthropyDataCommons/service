import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	UserPermissionGrant,
	InternallyWritableUserPermissionGrant,
} from '../../../types';

const createOrUpdateUserPermissionGrant = generateCreateOrUpdateItemOperation<
	UserPermissionGrant,
	InternallyWritableUserPermissionGrant,
	[]
>(
	'userPermissionGrants.insertOrUpdateOne',
	[
		'userKeycloakUserId',
		'permissionVerb',
		'rootEntityType',
		'rootEntityPk',
		'entities',
		'notAfter',
	],
	[],
);

export { createOrUpdateUserPermissionGrant };
