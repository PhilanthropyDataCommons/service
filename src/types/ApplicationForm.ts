import { ajv } from '../ajv';
import { writableApplicationFormFieldWithApplicationContextSchema } from './ApplicationFormField';
import type { JSONSchemaType } from 'ajv';
import type {
	ApplicationFormField,
	WritableApplicationFormFieldWithApplicationContext,
} from './ApplicationFormField';

export interface ApplicationForm {
	readonly id: number;
	opportunityId: number;
	version: number;
	fields?: ApplicationFormField[];
	readonly createdAt: Date;
}

export type ApplicationFormWrite = Omit<
	ApplicationForm,
	'createdAt' | 'fields' | 'id' | 'version'
> & { fields: WritableApplicationFormFieldWithApplicationContext[] };

export const applicationFormWriteSchema: JSONSchemaType<ApplicationFormWrite> =
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

export const isApplicationFormWrite = ajv.compile(applicationFormWriteSchema);
