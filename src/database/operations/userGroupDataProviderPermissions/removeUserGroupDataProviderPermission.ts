import { generateRemoveItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	UserGroupDataProviderPermission,
} from '../../../types';

const removeUserGroupDataProviderPermission = generateRemoveItemOperation<
	UserGroupDataProviderPermission,
	[
		keycloakOrganizationId: KeycloakId,
		dataProviderShortCode: ShortCode,
		permission: Permission,
	]
>(
	'userGroupDataProviderPermissions.deleteOne',
	'UserGroupDataProviderPermission',
	['keycloakOrganizationId', 'dataProviderShortCode', 'permission'],
);

export { removeUserGroupDataProviderPermission };
