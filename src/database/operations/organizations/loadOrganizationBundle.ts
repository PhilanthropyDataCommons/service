import { loadBundle } from '../generic/loadBundle';
import { getAuthenticationIdFromAuthContext } from '../../../types';
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
	const authenticationId = getAuthenticationIdFromAuthContext(authContext);
	const jsonResultSetBundle = await loadBundle<JsonResultSet<Organization>>(
		'organizations.selectWithPagination',
		{
			authenticationId,
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
