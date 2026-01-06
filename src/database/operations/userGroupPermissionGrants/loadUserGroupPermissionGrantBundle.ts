import { generateLoadBundleOperation } from '../generators';
import type { KeycloakId, UserGroupPermissionGrant } from '../../../types';

const loadUserGroupPermissionGrantBundle = generateLoadBundleOperation<
	UserGroupPermissionGrant,
	[keycloakOrganizationId: KeycloakId]
>(
	'userGroupPermissionGrants.selectWithPagination',
	'user_group_permission_grants',
	['keycloakOrganizationId'],
);

export { loadUserGroupPermissionGrantBundle };
