import type { JSONSchemaType } from 'ajv';
import type { BaseField } from './BaseField';
import type { Writable } from './Writable';

interface ApplicationFormField {
	readonly id: number;
	applicationFormId: number;
	baseFieldId: number;
	readonly baseField: BaseField;
	position: number;
	label: string;
	readonly createdAt: string;
}

type WritableApplicationFormField = Writable<ApplicationFormField>;

type WritableApplicationFormFieldWithApplicationContext = Omit<
	WritableApplicationFormField,
	'applicationFormId'
>;

const writableApplicationFormFieldWithApplicationContextSchema: JSONSchemaType<WritableApplicationFormFieldWithApplicationContext> =
	{
		type: 'object',
		properties: {
			baseFieldId: {
				type: 'integer',
			},
			position: {
				type: 'integer',
			},
			label: {
				type: 'string',
			},
		},
		required: ['baseFieldId', 'position', 'label'],
	};

export {
	ApplicationFormField,
	WritableApplicationFormField,
	WritableApplicationFormFieldWithApplicationContext,
	writableApplicationFormFieldWithApplicationContextSchema,
};
