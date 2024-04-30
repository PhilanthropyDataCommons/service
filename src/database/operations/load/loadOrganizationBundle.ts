import { loadBundle } from './loadBundle';
import type { Bundle, JsonResultSet, Organization } from '../../../types';

export const loadOrganizationBundle = async (queryParameters: {
	offset: number;
	limit: number;
	proposalId?: number;
}): Promise<Bundle<Organization>> => {
	const defaultQueryParameters = {
		proposalId: 0,
	};
	const jsonResultSetBundle = await loadBundle<JsonResultSet<Organization>>(
		'organizations.selectWithPagination',
		{
			...defaultQueryParameters,
			...queryParameters,
		},
		'organizations',
	);
	const entries = jsonResultSetBundle.entries.map((entry) => entry.object);
	return {
		...jsonResultSetBundle,
		entries,
	};
};
