import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	UserFunderPermission,
} from '../../../types';

const loadUserFunderPermission = generateLoadItemOperation<
	UserFunderPermission,
	[
		userKeycloakUserId: KeycloakId,
		funderShortCode: ShortCode,
		permission: Permission,
	]
>('userFunderPermissions.selectByPrimaryKey', 'UserFunderPermission', [
	'userKeycloakUserId',
	'funderShortCode',
	'permission',
]);

export { loadUserFunderPermission };
