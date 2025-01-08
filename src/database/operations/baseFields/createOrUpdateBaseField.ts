import { generateCreateOrUpdateItemOperation } from '../generators';
import type { BaseField, WritableBaseField } from '../../../types';

const createOrUpdateBaseField = generateCreateOrUpdateItemOperation<
	BaseField,
	WritableBaseField
>('baseFields.createOrUpdateByShortcode', [
	'scope',
	'dataType',
	'shortCode',
	'label',
	'description',
]);

export { createOrUpdateBaseField };
