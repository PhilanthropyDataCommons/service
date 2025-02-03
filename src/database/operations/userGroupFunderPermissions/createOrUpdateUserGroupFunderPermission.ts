import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	UserGroupFunderPermission,
	InternallyWritableUserGroupFunderPermission,
} from '../../../types';

const createOrUpdateUserGroupFunderPermission =
	generateCreateOrUpdateItemOperation<
		UserGroupFunderPermission,
		InternallyWritableUserGroupFunderPermission,
		[]
	>(
		'userGroupFunderPermissions.insertOrUpdateOne',
		['keycloakOrganizationId', 'permission', 'funderShortCode', 'createdBy'],
		[],
	);

export { createOrUpdateUserGroupFunderPermission };
