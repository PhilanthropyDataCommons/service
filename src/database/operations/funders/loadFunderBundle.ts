import { loadBundle } from '../generic/loadBundle';
import type { Bundle, JsonResultSet, Funder } from '../../../types';

const loadFunderBundle = async (
	limit: number | undefined,
	offset: number,
): Promise<Bundle<Funder>> => {
	const bundle = await loadBundle<JsonResultSet<Funder>>(
		'funders.selectWithPagination',
		{
			limit,
			offset,
		},
		'funders',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};

export { loadFunderBundle };
