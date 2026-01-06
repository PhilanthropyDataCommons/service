import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	UserGroupPermissionGrant,
	InternallyWritableUserGroupPermissionGrant,
} from '../../../types';

const createOrUpdateUserGroupPermissionGrant =
	generateCreateOrUpdateItemOperation<
		UserGroupPermissionGrant,
		InternallyWritableUserGroupPermissionGrant,
		[]
	>(
		'userGroupPermissionGrants.insertOrUpdateOne',
		[
			'keycloakOrganizationId',
			'permissionVerb',
			'rootEntityType',
			'rootEntityPk',
			'entities',
			'notAfter',
		],
		[],
	);

export { createOrUpdateUserGroupPermissionGrant };
