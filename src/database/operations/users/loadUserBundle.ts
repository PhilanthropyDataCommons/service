import { generateLoadBundleOperation } from '../generators';
import type { User, KeycloakId } from '../../../types';

const loadUserBundle = generateLoadBundleOperation<
	User,
	[keycloakUserId: KeycloakId | undefined]
>('users.selectWithPagination', 'users', ['keycloakUserId']);

export { loadUserBundle };
