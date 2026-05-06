import { generateCreateItemOperation } from '../generators';
import type {
	ApplicationFormField,
	WritableApplicationFormField,
} from '../../../types';

const createApplicationFormField = generateCreateItemOperation<
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
		'inputType',
	],
	[],
);

export { createApplicationFormField };
