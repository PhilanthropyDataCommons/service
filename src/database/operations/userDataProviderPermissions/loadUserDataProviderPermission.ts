import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	UserDataProviderPermission,
} from '../../../types';

const loadUserDataProviderPermission = generateLoadItemOperation<
	UserDataProviderPermission,
	[
		userKeycloakUserId: KeycloakId,
		dataProviderShortCode: ShortCode,
		permission: Permission,
	]
>(
	'userDataProviderPermissions.selectByPrimaryKey',
	'UserDataProviderPermission',
	['userKeycloakUserId', 'dataProviderShortCode', 'permission'],
);

export { loadUserDataProviderPermission };
