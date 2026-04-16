import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemaker';
import type { Changemaker, Id } from '../../../types';

const loadChangemakerBundle = generateLoadBundleOperation<
	Changemaker,
	[proposalId: Id | undefined, search: string | undefined]
>(
	'changemakers.selectWithPagination',
	['proposalId', 'search'],
	decorateWithFileDownloadUrls,
);

export { loadChangemakerBundle };
