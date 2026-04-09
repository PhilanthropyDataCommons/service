import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemaker';
import type { Changemaker } from '../../../types';

const loadChangemakerBundle = generateLoadBundleOperation<
	Changemaker,
	[proposalId: number | undefined, search: string | undefined]
>(
	'changemakers.selectWithPagination',
	['proposalId', 'search'],
	decorateWithFileDownloadUrls,
);

export { loadChangemakerBundle };
