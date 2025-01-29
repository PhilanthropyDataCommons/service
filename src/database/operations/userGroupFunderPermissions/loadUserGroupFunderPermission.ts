import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	UserGroupFunderPermission,
} from '../../../types';

const loadUserGroupFunderPermission = generateLoadItemOperation<
	UserGroupFunderPermission,
	[
		keycloakOrganizationId: KeycloakId,
		funderShortCode: ShortCode,
		permission: Permission,
	]
>(
	'userGroupFunderPermissions.selectByPrimaryKey',
	'UserGroupFunderPermission',
	['keycloakOrganizationId', 'funderShortCode', 'permission'],
);

export { loadUserGroupFunderPermission };
