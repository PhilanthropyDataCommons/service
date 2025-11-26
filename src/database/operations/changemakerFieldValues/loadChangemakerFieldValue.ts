import { generateLoadItemOperation } from '../generators';
import type { ChangemakerFieldValue, Id } from '../../../types';

const loadChangemakerFieldValue = generateLoadItemOperation<
	ChangemakerFieldValue,
	[changemakerFieldValueId: Id]
>('changemakerFieldValues.selectById', 'ChangemakerFieldValue', [
	'changemakerFieldValueId',
]);

export { loadChangemakerFieldValue };
