import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	UserGroupDataProviderPermission,
	InternallyWritableUserGroupDataProviderPermission,
} from '../../../types';

const createOrUpdateUserGroupDataProviderPermission =
	generateCreateOrUpdateItemOperation<
		UserGroupDataProviderPermission,
		InternallyWritableUserGroupDataProviderPermission,
		[]
	>('userGroupDataProviderPermissions.insertOrUpdateOne', [
		'keycloakOrganizationId',
		'permission',
		'dataProviderShortCode',
		'createdBy',
	],[]);

export { createOrUpdateUserGroupDataProviderPermission };
