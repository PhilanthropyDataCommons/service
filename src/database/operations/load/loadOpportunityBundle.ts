import { loadBundle } from './loadBundle';
import type { Bundle, JsonResultSet, Opportunity } from '../../../types';

const loadOpportunityBundle = async (
	queryParameters: {
		offset?: number;
		limit?: number;
	} = {},
): Promise<Bundle<Opportunity>> => {
	const defaultQueryParameters = {
		offset: 0,
		limit: 0,
	};
	const { offset, limit } = queryParameters;

	const bundle = await loadBundle<JsonResultSet<Opportunity>>(
		'opportunities.selectWithPagination',
		{
			...defaultQueryParameters,
			offset,
			limit,
		},
		'opportunities',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};

export { loadOpportunityBundle };
