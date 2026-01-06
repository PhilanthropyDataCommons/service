import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	PermissionVerb,
	PermissionEntityType,
	UserGroupPermissionGrant,
} from '../../../types';

const loadUserGroupPermissionGrant = generateLoadItemOperation<
	UserGroupPermissionGrant,
	[
		keycloakOrganizationId: KeycloakId,
		rootEntityType: PermissionEntityType,
		rootEntityPk: string,
		permissionVerb: PermissionVerb,
	]
>('userGroupPermissionGrants.selectByPrimaryKey', 'UserGroupPermissionGrant', [
	'keycloakOrganizationId',
	'rootEntityType',
	'rootEntityPk',
	'permissionVerb',
]);

export { loadUserGroupPermissionGrant };
