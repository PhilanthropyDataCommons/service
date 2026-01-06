import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	PermissionVerb,
	PermissionEntityType,
	UserPermissionGrant,
} from '../../../types';

const loadUserPermissionGrant = generateLoadItemOperation<
	UserPermissionGrant,
	[
		userKeycloakUserId: KeycloakId,
		rootEntityType: PermissionEntityType,
		rootEntityPk: string,
		permissionVerb: PermissionVerb,
	]
>('userPermissionGrants.selectByPrimaryKey', 'UserPermissionGrant', [
	'userKeycloakUserId',
	'rootEntityType',
	'rootEntityPk',
	'permissionVerb',
]);

export { loadUserPermissionGrant };
