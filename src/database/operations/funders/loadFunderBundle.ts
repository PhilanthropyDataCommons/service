import { generateLoadBundleOperation } from '../generators';
import type { Funder } from '../../../types';

const loadFunderBundle = generateLoadBundleOperation<
	Funder,
	[search: string | undefined]
>('funders.selectWithPagination', ['search']);

export { loadFunderBundle };
