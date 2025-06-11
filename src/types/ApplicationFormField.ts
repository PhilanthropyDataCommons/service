import type { JSONSchemaType } from 'ajv';
import type { BaseField } from './BaseField';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';

interface ApplicationFormField {
	readonly id: number;
	applicationFormId: number;
	baseFieldShortCode: ShortCode;
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
			baseFieldShortCode: {
				type: 'string',
			},
			position: {
				type: 'integer',
			},
			label: {
				type: 'string',
			},
		},
		required: ['baseFieldShortCode', 'position', 'label'],
	};

export {
	type ApplicationFormField,
	type WritableApplicationFormField,
	type WritableApplicationFormFieldWithApplicationContext,
	writableApplicationFormFieldWithApplicationContextSchema,
};
