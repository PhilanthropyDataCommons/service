import { ajv } from '../ajv';
import { writableApplicationFormFieldWithApplicationContextSchema } from './ApplicationFormField';
import type { JSONSchemaType } from 'ajv';
import type {
	ApplicationFormField,
	WritableApplicationFormFieldWithApplicationContext,
} from './ApplicationFormField';
import type { Writable } from './Writable';

interface ApplicationForm {
	readonly id: number;
	opportunityId: number;
	readonly version: number;
	readonly fields: ApplicationFormField[];
	readonly createdAt: string;
}

type WritableApplicationForm = Writable<ApplicationForm>;

type WritableApplicationFormWithFields = WritableApplicationForm & {
	fields: WritableApplicationFormFieldWithApplicationContext[];
};

const writableApplicationFormWithFieldsSchema: JSONSchemaType<WritableApplicationFormWithFields> =
	{
		type: 'object',
		properties: {
			opportunityId: {
				type: 'number',
			},
			fields: {
				type: 'array',
				items: writableApplicationFormFieldWithApplicationContextSchema,
			},
		},
		required: ['opportunityId', 'fields'],
	};

const isWritableApplicationFormWithFields = ajv.compile(
	writableApplicationFormWithFieldsSchema,
);

export {
	type ApplicationForm,
	isWritableApplicationFormWithFields,
	writableApplicationFormWithFieldsSchema,
	type WritableApplicationForm,
};
