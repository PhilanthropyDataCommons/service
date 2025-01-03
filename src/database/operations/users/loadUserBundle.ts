import { generateLoadBundleOperation } from '../generators';
import type { User, KeycloakId } from '../../../types';

const loadUserBundle = generateLoadBundleOperation<
	User,
	[
		authContextKeycloakUserId: KeycloakId | undefined,
		authContextIsAdministrator: boolean | undefined,
		keycloakUserId: KeycloakId | undefined,
	]
>('users.selectWithPagination', 'users', [
	'authContextKeycloakUserId',
	'authContextIsAdministrator',
	'keycloakUserId',
]);

export { loadUserBundle };
