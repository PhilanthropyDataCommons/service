import { generateLoadItemOperation } from '../generators';
import type { BaseField, Id } from '../../../types';

const loadBaseField = generateLoadItemOperation<BaseField, [baseFieldId: Id]>(
	'baseFields.selectById',
	'BaseField',
	['baseFieldId'],
);

export { loadBaseField };
