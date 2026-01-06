import { generateLoadBundleOperation } from '../generators';
import type { KeycloakId, UserPermissionGrant } from '../../../types';

const loadUserPermissionGrantBundle = generateLoadBundleOperation<
	UserPermissionGrant,
	[userKeycloakUserId: KeycloakId]
>('userPermissionGrants.selectWithPagination', 'user_permission_grants', [
	'userKeycloakUserId',
]);

export { loadUserPermissionGrantBundle };
