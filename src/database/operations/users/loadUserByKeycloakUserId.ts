import { generateLoadItemOperation } from '../generators';
import type { KeycloakId, User } from '../../../types';

const loadUserByKeycloakUserId = generateLoadItemOperation<
	User,
	[keycloakUserId: KeycloakId]
>('users.selectByKeycloakUserId', 'User', ['keycloakUserId']);

export { loadUserByKeycloakUserId };
