import { generateLoadBundleOperation } from '../generators';
import type { Source } from '../../../types';

const loadSourceBundle = generateLoadBundleOperation<Source, []>(
	'sources.selectWithPagination',
	[],
);

export { loadSourceBundle };
