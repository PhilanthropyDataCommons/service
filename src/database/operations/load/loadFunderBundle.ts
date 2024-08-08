import { loadBundle } from './loadBundle';
import type { Bundle, JsonResultSet, Funder } from '../../../types';

const loadFunderBundle = async (
	queryParameters: {
		offset?: number;
		limit?: number;
	} = {},
): Promise<Bundle<Funder>> => {
	const defaultQueryParameters = {
		offset: 0,
		limit: 0,
	};
	const { offset, limit } = queryParameters;

	const bundle = await loadBundle<JsonResultSet<Funder>>(
		'funders.selectWithPagination',
		{
			...defaultQueryParameters,
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
