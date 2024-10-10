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
	const userId = authContext?.user.id;
	const isAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<User>>(
		'users.selectWithPagination',
		{
			keycloakUserId,
			isAdministrator,
			limit,
			offset,
			userId,
		},
		'users',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
