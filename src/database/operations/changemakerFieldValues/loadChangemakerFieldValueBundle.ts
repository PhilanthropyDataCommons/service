import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/changemakerFieldValue';
import type { ChangemakerFieldValue, Id } from '../../../types';

const loadChangemakerFieldValueBundle = generateLoadBundleOperation<
	ChangemakerFieldValue,
	[batchId: Id | undefined, changemakerId: Id | undefined]
>(
	'changemakerFieldValues.selectWithPagination',
	['batchId', 'changemakerId'],
	decorateWithFileDownloadUrl,
);

export { loadChangemakerFieldValueBundle };
