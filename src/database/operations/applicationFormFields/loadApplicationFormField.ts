import { generateLoadItemOperation } from '../generators';
import type { ApplicationFormField, Id } from '../../../types';

const loadApplicationFormField = generateLoadItemOperation<
	ApplicationFormField,
	[applicationFormFieldId: Id]
>('applicationFormFields.selectById', 'ApplicationFormField', [
	'applicationFormFieldId',
]);

export { loadApplicationFormField };
