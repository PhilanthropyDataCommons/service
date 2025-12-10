import { generateCreateOrUpdateItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/changemakerFieldValue';
import type {
	ChangemakerFieldValue,
	InternallyWritableChangemakerFieldValue,
} from '../../../types';

const createChangemakerFieldValue = generateCreateOrUpdateItemOperation<
	ChangemakerFieldValue,
	InternallyWritableChangemakerFieldValue,
	[]
>(
	'changemakerFieldValues.insertOne',
	[
		'changemakerId',
		'baseFieldShortCode',
		'sourceId',
		'value',
		'isValid',
		'goodAsOf',
	],
	[],
	decorateWithFileDownloadUrl,
);

export { createChangemakerFieldValue };
