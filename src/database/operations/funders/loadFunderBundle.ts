import { generateLoadBundleOperation } from '../generators';
import type { Funder } from '../../../types';

const loadFunderBundle = generateLoadBundleOperation<Funder, []>(
	'funders.selectWithPagination',
	[],
);

export { loadFunderBundle };
