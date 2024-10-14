import { loadBundle } from '../generic/loadBundle';
import { getKeycloakUserIdFromAuthContext } from '../../../types';
import type {
	AuthContext,
	Bundle,
	JsonResultSet,
	Changemaker,
} from '../../../types';

export const loadChangemakerBundle = async (
	authContext: AuthContext | undefined,
	proposalId: number | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<Changemaker>> => {
	const keycloakUserId = getKeycloakUserIdFromAuthContext(authContext);
	const jsonResultSetBundle = await loadBundle<JsonResultSet<Changemaker>>(
		'changemakers.selectWithPagination',
		{
			keycloakUserId,
			limit,
			offset,
			proposalId,
		},
		'changemakers',
	);
	const entries = jsonResultSetBundle.entries.map((entry) => entry.object);
	return {
		...jsonResultSetBundle,
		entries,
	};
};
