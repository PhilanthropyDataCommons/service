import { generateRemoveItemOperation } from '../generators';
import type {
	KeycloakId,
	Id,
	Permission,
	UserChangemakerPermission,
} from '../../../types';

const removeUserChangemakerPermission = generateRemoveItemOperation<
	UserChangemakerPermission,
	[userKeycloakUserId: KeycloakId, changemakerId: Id, permission: Permission]
>('userChangemakerPermissions.deleteOne', 'UserChangemakerPermission', [
	'userKeycloakUserId',
	'changemakerId',
	'permission',
]);

export { removeUserChangemakerPermission };
