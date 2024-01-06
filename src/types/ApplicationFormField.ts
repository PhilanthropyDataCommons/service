import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface ApplicationFormField {
	readonly id: number;
	applicationFormId: number;
	baseFieldId: number;
	position: number;
	label: string;
	readonly createdAt: Date;
}

export type ApplicationFormFieldWrite = Omit<
	ApplicationFormField,
	'applicationFormId' | 'createdAt' | 'id'
>;

export const applicationFormFieldSchema: JSONSchemaType<ApplicationFormField> =
	{
		type: 'object',
		properties: {
			id: {
				type: 'integer',
			},
			applicationFormId: {
				type: 'integer',
			},
			baseFieldId: {
				type: 'integer',
			},
			position: {
				type: 'integer',
			},
			label: {
				type: 'string',
			},
			createdAt: {
				type: 'object',
				required: [],
				instanceof: 'Date',
			},
		},
		required: [
			'id',
			'applicationFormId',
			'baseFieldId',
			'position',
			'label',
			'createdAt',
		],
	};

export const isApplicationFormField = ajv.compile(applicationFormFieldSchema);

export const applicationFormFieldWriteSchema: JSONSchemaType<ApplicationFormFieldWrite> =
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

const applicationFormFieldArraySchema: JSONSchemaType<ApplicationFormField[]> =
	{
		type: 'array',
		items: applicationFormFieldSchema,
	};

export const isApplicationFormFieldArray = ajv.compile(
	applicationFormFieldArraySchema,
);
