import { generateCreateOrUpdateItemOperation } from '../generators';
import type { BaseField, WritableBaseField } from '../../../types';

const createBaseField = generateCreateOrUpdateItemOperation<
	BaseField,
	WritableBaseField
>('baseFields.insertOne', [
	'scope',
	'dataType',
	'shortCode',
	'label',
	'description',
]);

export { createBaseField };
