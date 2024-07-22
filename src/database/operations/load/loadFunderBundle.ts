import { loadBundle } from './loadBundle';
import type { Bundle, JsonResultSet, Funder } from '../../../types';

const loadFunderBundle = async (
	offset: number,
	limit: number,
): Promise<Bundle<Funder>> => {
	const bundle = await loadBundle<JsonResultSet<Funder>>(
		'funders.selectWithPagination',
		{
			offset,
			limit,
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
