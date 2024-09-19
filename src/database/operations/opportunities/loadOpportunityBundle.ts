import { loadBundle } from '../generic/loadBundle';
import type { Bundle, JsonResultSet, Opportunity } from '../../../types';

const loadOpportunityBundle = async (
	limit: number | undefined,
	offset: number,
): Promise<Bundle<Opportunity>> => {
	const bundle = await loadBundle<JsonResultSet<Opportunity>>(
		'opportunities.selectWithPagination',
		{
			limit,
			offset,
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
