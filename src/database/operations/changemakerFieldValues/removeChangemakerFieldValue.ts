import { generateRemoveItemOperation } from '../generators';
import type { ChangemakerFieldValue, Id } from '../../../types';

const removeChangemakerFieldValue = generateRemoveItemOperation<
	ChangemakerFieldValue,
	[changemakerFieldValueId: Id]
>('changemakerFieldValues.deleteById', 'ChangemakerFieldValue', [
	'changemakerFieldValueId',
]);

export { removeChangemakerFieldValue };
