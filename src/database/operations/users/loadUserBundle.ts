import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	User,
	AuthContext,
	KeycloakUserId,
} from '../../../types';

export const loadUserBundle = async (
	authContext: AuthContext | undefined,
	keycloakUserId: KeycloakUserId | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<User>> => {
	const authContextKeycloakUserId = authContext?.user.keycloakUserId;
	const authContextIsAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<User>>(
		'users.selectWithPagination',
		{
			authContextIsAdministrator,
			authContextKeycloakUserId,
			keycloakUserId,
			limit,
			offset,
		},
		'users',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
