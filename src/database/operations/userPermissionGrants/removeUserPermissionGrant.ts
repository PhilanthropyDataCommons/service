import { generateRemoveItemOperation } from '../generators';
import type {
	KeycloakId,
	PermissionVerb,
	PermissionEntityType,
	UserPermissionGrant,
} from '../../../types';

const removeUserPermissionGrant = generateRemoveItemOperation<
	UserPermissionGrant,
	[
		userKeycloakUserId: KeycloakId,
		rootEntityType: PermissionEntityType,
		rootEntityPk: string,
		permissionVerb: PermissionVerb,
	]
>('userPermissionGrants.deleteOne', 'UserPermissionGrant', [
	'userKeycloakUserId',
	'rootEntityType',
	'rootEntityPk',
	'permissionVerb',
]);

export { removeUserPermissionGrant };
