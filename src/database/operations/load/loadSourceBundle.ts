import { loadBundle } from './loadBundle';
import type { Bundle, JsonResultSet, Source } from '../../../types';

const loadSourceBundle = async (
	queryParameters: {
		offset?: number;
		limit?: number;
	} = {},
): Promise<Bundle<Source>> => {
	const defaultQueryParameters = {
		offset: 0,
		limit: 0,
	};
	const { offset, limit } = queryParameters;

	const bundle = await loadBundle<JsonResultSet<Source>>(
		'sources.selectWithPagination',
		{
			...defaultQueryParameters,
			offset,
			limit,
		},
		'sources',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};

export { loadSourceBundle };
