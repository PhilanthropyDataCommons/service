import { generateCreateOrUpdateItemOperation } from '../generators';
import type { BaseField, InternallyWritableBaseField } from '../../../types';

const createBaseField = generateCreateOrUpdateItemOperation<
	BaseField,
	InternallyWritableBaseField,
	[]
>(
	'baseFields.insertOne',
	['scope', 'dataType', 'shortCode', 'label', 'description'],
	[],
);

export { createBaseField };
