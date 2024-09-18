import { loadBundle } from '../generic/loadBundle';
import type { Bundle, DataProvider, JsonResultSet } from '../../../types';

const loadDataProviderBundle = async (
	offset: number,
	limit: number,
): Promise<Bundle<DataProvider>> => {
	const defaultQueryParameters = {
		offset: 0,
		limit: 0,
	};
	const bundle = await loadBundle<JsonResultSet<DataProvider>>(
		'dataProviders.selectWithPagination',
		{
			...defaultQueryParameters,
			offset,
			limit,
		},
		'data_providers',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};

export { loadDataProviderBundle };
