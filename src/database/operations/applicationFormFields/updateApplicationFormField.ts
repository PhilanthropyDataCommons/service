import { generateUpdateItemOperation } from '../generators';
import type {
	ApplicationFormField,
	ApplicationFormFieldPatch,
	Id,
} from '../../../types';

const updateApplicationFormField = generateUpdateItemOperation<
	ApplicationFormField,
	ApplicationFormFieldPatch,
	[applicationFormFieldId: Id]
>(
	'applicationFormFields.updateById',
	['label', 'instructions', 'inputType'],
	['applicationFormFieldId'],
);

export { updateApplicationFormField };
