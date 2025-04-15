import { generateCreateOrUpdateItemOperation } from '../generators';
import type { BaseField, InternallyWritableBaseField } from '../../../types';

const createOrUpdateBaseField = generateCreateOrUpdateItemOperation<
	BaseField,
	InternallyWritableBaseField,
	[]
>(
	'baseFields.createOrUpdateByShortcode',
	['scope', 'dataType', 'shortCode', 'label', 'description'],
	[],
);

export { createOrUpdateBaseField };
