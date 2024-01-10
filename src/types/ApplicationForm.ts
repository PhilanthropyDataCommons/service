import { ajv } from '../ajv';
import {
	applicationFormFieldSchema,
	applicationFormFieldWriteSchema,
} from './ApplicationFormField';
import type { JSONSchemaType } from 'ajv';
import type {
	ApplicationFormField,
	ApplicationFormFieldWrite,
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
> & { fields: ApplicationFormFieldWrite[] };

export const applicationFormSchema: JSONSchemaType<ApplicationForm> = {
	type: 'object',
	properties: {
		id: {
			type: 'integer',
		},
		opportunityId: {
			type: 'integer',
		},
		version: {
			type: 'integer',
		},
		fields: {
			type: 'array',
			items: applicationFormFieldSchema,
			nullable: true,
		},
		createdAt: {
			type: 'object',
			required: [],
			instanceof: 'Date',
		},
	},
	required: ['id', 'opportunityId', 'version', 'createdAt'],
};

export const isApplicationForm = ajv.compile(applicationFormSchema);

export const applicationFormWriteSchema: JSONSchemaType<ApplicationFormWrite> =
	{
		type: 'object',
		properties: {
			opportunityId: {
				type: 'number',
			},
			fields: {
				type: 'array',
				items: applicationFormFieldWriteSchema,
			},
		},
		required: ['opportunityId', 'fields'],
	};

export const isApplicationFormWrite = ajv.compile(applicationFormWriteSchema);

const applicationFormArraySchema: JSONSchemaType<ApplicationForm[]> = {
	type: 'array',
	items: applicationFormSchema,
};

export const isApplicationFormArray = ajv.compile(applicationFormArraySchema);
