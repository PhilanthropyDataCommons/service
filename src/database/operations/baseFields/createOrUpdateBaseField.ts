import { generateCreateOrUpdateItemOperation } from '../generators';
import type { BaseField, InternallyWritableBaseField } from '../../../types';

const createOrUpdateBaseField = generateCreateOrUpdateItemOperation<
	BaseField,
	InternallyWritableBaseField,
	[]
>(
	'baseFields.createOrUpdateOne',
	[
		'scope',
		'dataType',
		'shortCode',
		'label',
		'description',
		'valueRelevanceHours',
	],
	[],
);

export { createOrUpdateBaseField };
