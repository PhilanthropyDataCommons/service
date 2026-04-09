import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/changemakerFieldValue';
import type { ChangemakerFieldValue } from '../../../types';

const loadChangemakerFieldValueBundle = generateLoadBundleOperation<
	ChangemakerFieldValue,
	[batchId: number | undefined, changemakerId: number | undefined]
>(
	'changemakerFieldValues.selectWithPagination',
	['batchId', 'changemakerId'],
	decorateWithFileDownloadUrl,
);

export { loadChangemakerFieldValueBundle };
