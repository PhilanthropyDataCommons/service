import { loadBundle } from '../generic/loadBundle';
import type { Bundle, JsonResultSet, Source } from '../../../types';

const loadSourceBundle = async (
	limit: number | undefined,
	offset: number,
): Promise<Bundle<Source>> => {
	const bundle = await loadBundle<JsonResultSet<Source>>(
		'sources.selectWithPagination',
		{
			limit,
			offset,
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
