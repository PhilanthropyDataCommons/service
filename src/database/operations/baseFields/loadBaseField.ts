import { generateLoadItemOperation } from '../generators';
import type { BaseField, ShortCode } from '../../../types';

const loadBaseField = generateLoadItemOperation<
	BaseField,
	[baseFieldShortCode: ShortCode]
>('baseFields.selectByShortCode', 'BaseField', ['shortCode']);

export { loadBaseField };
