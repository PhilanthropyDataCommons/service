import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	ApplicationFormField,
	ApplicationFormFieldPatch,
	Id,
} from '../../../types';

const updateApplicationFormField = generateCreateOrUpdateItemOperation<
	ApplicationFormField,
	ApplicationFormFieldPatch,
	[applicationFormFieldId: Id]
>(
	'applicationFormFields.updateById',
	['label', 'instructions'],
	['applicationFormFieldId'],
);

export { updateApplicationFormField };
