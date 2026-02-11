import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemaker';
import type { Changemaker } from '../../../types';

const loadChangemakerBundle = generateLoadBundleOperation<
	Changemaker,
	[proposalId: number | undefined]
>(
	'changemakers.selectWithPagination',
	'changemakers',
	['proposalId'],
	decorateWithFileDownloadUrls,
);

export { loadChangemakerBundle };
