import { generateRemoveItemOperation } from '../generators';
import type {
	KeycloakId,
	PermissionVerb,
	PermissionEntityType,
	UserGroupPermissionGrant,
} from '../../../types';

const removeUserGroupPermissionGrant = generateRemoveItemOperation<
	UserGroupPermissionGrant,
	[
		keycloakOrganizationId: KeycloakId,
		rootEntityType: PermissionEntityType,
		rootEntityPk: string,
		permissionVerb: PermissionVerb,
	]
>('userGroupPermissionGrants.deleteOne', 'UserGroupPermissionGrant', [
	'keycloakOrganizationId',
	'rootEntityType',
	'rootEntityPk',
	'permissionVerb',
]);

export { removeUserGroupPermissionGrant };
