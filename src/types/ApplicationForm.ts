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
	name: string | null;
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
			name: {
				type: 'string',
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * This is a workaround for the fact that AJV does not support nullable types in TypeScript.
				 * See: https://github.com/ajv-validator/ajv/issues/2163
				 */
				nullable: true as false,
			},
			fields: {
				type: 'array',
				items: writableApplicationFormFieldWithApplicationContextSchema,
			},
		},
		required: ['opportunityId', 'name', 'fields'],
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
