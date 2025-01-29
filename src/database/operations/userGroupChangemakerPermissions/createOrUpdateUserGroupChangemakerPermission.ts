import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	InternallyWritableUserGroupChangemakerPermission,
	UserGroupChangemakerPermission,
} from '../../../types';

const createOrUpdateUserGroupChangemakerPermission =
	generateCreateOrUpdateItemOperation<
		UserGroupChangemakerPermission,
		InternallyWritableUserGroupChangemakerPermission,
		[]
	>('userGroupChangemakerPermissions.insertOrUpdateOne', [
		'keycloakOrganizationId',
		'permission',
		'changemakerId',
		'createdBy',
	],[]);

export { createOrUpdateUserGroupChangemakerPermission };
