import { generateRemoveItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	UserDataProviderPermission,
} from '../../../types';

const removeUserDataProviderPermission = generateRemoveItemOperation<
	UserDataProviderPermission,
	[
		keycloakOrganizationId: KeycloakId,
		dataProviderShortCode: ShortCode,
		permission: Permission,
	]
>('userDataProviderPermissions.deleteOne', 'UserDataProviderPermission', [
	'userKeycloakUserId',
	'dataProviderShortCode',
	'permission',
]);

export { removeUserDataProviderPermission };
