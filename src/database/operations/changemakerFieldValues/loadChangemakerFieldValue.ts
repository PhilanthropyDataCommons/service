import { generateLoadItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/changemakerFieldValue';
import type { ChangemakerFieldValue, Id } from '../../../types';

const loadChangemakerFieldValue = generateLoadItemOperation<
	ChangemakerFieldValue,
	[fieldValueId: Id]
>(
	'changemakerFieldValues.selectById',
	'ChangemakerFieldValue',
	['fieldValueId'],
	decorateWithFileDownloadUrl,
);

export { loadChangemakerFieldValue };
