import { generateLoadBundleOperation } from '../generators';
import type { Funder } from '../../../types';

const loadFunderBundle = generateLoadBundleOperation<
	Funder,
	[search: string | undefined, isCollaborative: boolean | undefined]
>('funders.selectWithPagination', ['search', 'isCollaborative']);

export { loadFunderBundle };
