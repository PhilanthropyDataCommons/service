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
