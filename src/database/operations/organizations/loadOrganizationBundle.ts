import { loadBundle } from '../generic/loadBundle';
import { getKeycloakUserIdFromAuthContext } from '../../../types';
import type {
	AuthContext,
	Bundle,
	JsonResultSet,
	Organization,
} from '../../../types';

export const loadOrganizationBundle = async (
	authContext: AuthContext | undefined,
	proposalId: number | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<Organization>> => {
	const keycloakUserId = getKeycloakUserIdFromAuthContext(authContext);
	const jsonResultSetBundle = await loadBundle<JsonResultSet<Organization>>(
		'organizations.selectWithPagination',
		{
			keycloakUserId,
			limit,
			offset,
			proposalId,
		},
		'organizations',
	);
	const entries = jsonResultSetBundle.entries.map((entry) => entry.object);
	return {
		...jsonResultSetBundle,
		entries,
	};
};
