import { loadBundle } from '../generic/loadBundle';
import type { Bundle, DataProvider, JsonResultSet } from '../../../types';

const loadDataProviderBundle = async (
	limit: number | undefined,
	offset: number,
): Promise<Bundle<DataProvider>> => {
	const bundle = await loadBundle<JsonResultSet<DataProvider>>(
		'dataProviders.selectWithPagination',
		{
			limit,
			offset,
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
