import { generateLoadBundleOperation } from '../generators';
import type { Changemaker } from '../../../types';

const loadChangemakerBundle = generateLoadBundleOperation<
	Changemaker,
	[proposalId: number | undefined]
>('changemakers.selectWithPagination', 'changemakers', ['proposalId']);

export { loadChangemakerBundle };
