import { generateCreateOrUpdateItemOperation } from '../generators';
import type { BaseField, WritableBaseField } from '../../../types';

const updateBaseField = generateCreateOrUpdateItemOperation<
	BaseField,
	WritableBaseField,
	[baseFieldId: number]
>(
	'baseFields.updateById',
	[
		'label',
		'description',
		'shortCode',
		'dataType',
		'scope',
		'valueRelevanceHours',
	],
	['baseFieldId'],
);

export { updateBaseField };
