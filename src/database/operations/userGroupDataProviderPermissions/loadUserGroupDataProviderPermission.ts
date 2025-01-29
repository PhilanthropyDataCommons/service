import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	UserGroupDataProviderPermission,
} from '../../../types';

const loadUserGroupDataProviderPermission = generateLoadItemOperation<
	UserGroupDataProviderPermission,
	[
		keycloakOrganizationId: KeycloakId,
		dataProviderShortCode: ShortCode,
		permission: Permission,
	]
>(
	'userGroupDataProviderPermissions.selectByPrimaryKey',
	'UserGroupDataProviderPermission',
	['keycloakOrganizationId', 'dataProviderShortCode', 'permission'],
);

export { loadUserGroupDataProviderPermission };
