import { generateLoadItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemaker';
import type { Changemaker, Id } from '../../../types';

const loadChangemaker = generateLoadItemOperation<
	Changemaker,
	[changemakerId: Id]
>(
	'changemakers.selectById',
	'Changemaker',
	['changemakerId'],
	decorateWithFileDownloadUrls,
);

export { loadChangemaker };
