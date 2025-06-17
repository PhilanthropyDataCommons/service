import { generateCreateOrUpdateItemOperation } from '../generators';
import type { BaseField, InternallyWritableBaseField } from '../../../types';

const createOrUpdateBaseField = generateCreateOrUpdateItemOperation<
	BaseField,
	InternallyWritableBaseField,
	[]
>(
	'baseFields.createOrUpdateOne',
	[
		'category',
		'dataType',
		'shortCode',
		'label',
		'description',
		'valueRelevanceHours',
		'sensitivityClassification',
	],
	[],
);

export { createOrUpdateBaseField };
