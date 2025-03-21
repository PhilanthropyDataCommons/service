import { generateRemoveItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	UserGroupFunderPermission,
} from '../../../types';

const removeUserGroupFunderPermission = generateRemoveItemOperation<
	UserGroupFunderPermission,
	[
		keycloakOrganizationId: KeycloakId,
		funderShortCode: ShortCode,
		permission: Permission,
	]
>('userGroupFunderPermissions.deleteOne', 'UserGroupFunderPermission', [
	'keycloakOrganizationId',
	'funderShortCode',
	'permission',
]);

export { removeUserGroupFunderPermission };
