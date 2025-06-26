import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	ApplicationFormField,
	WritableApplicationFormField,
} from '../../../types';

const createApplicationFormField = generateCreateOrUpdateItemOperation<
	ApplicationFormField,
	WritableApplicationFormField,
	[]
>(
	'applicationFormFields.insertOne',
	[
		'applicationFormId',
		'baseFieldShortCode',
		'position',
		'label',
		'instructions',
	],
	[],
);

export { createApplicationFormField };
