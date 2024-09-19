import { loadBundle } from '../generic/loadBundle';
import type { Bundle, JsonResultSet, Source } from '../../../types';

const loadSourceBundle = async (
	offset: number,
	limit: number,
): Promise<Bundle<Source>> => {
	const bundle = await loadBundle<JsonResultSet<Source>>(
		'sources.selectWithPagination',
		{
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
