import { generateRemoveItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	UserFunderPermission,
} from '../../../types';

const removeUserFunderPermission = generateRemoveItemOperation<
	UserFunderPermission,
	[
		userKeycloakUserId: KeycloakId,
		funderShortCode: ShortCode,
		permission: Permission,
	]
>('userFunderPermissions.deleteOne', 'UserFunderPermission', [
	'userKeycloakUserId',
	'funderShortCode',
	'permission',
]);

export { removeUserFunderPermission };
