import type { JSONSchemaType } from 'ajv';
import type { ApplicationFormField } from './ApplicationFormField';

export interface ProposalFieldValue {
	id: number;
	proposalVersionId: number;
	applicationFormFieldId: number;
	position: number;
	value: string;
	createdAt: Date;
	applicationFormField?: ApplicationFormField;
}

export type ProposalFieldValueWrite = Omit<
	ProposalFieldValue,
	'applicationFormField' | 'createdAt' | 'id' | 'proposalVersionId'
>;

export const proposalFieldValueWriteSchema: JSONSchemaType<ProposalFieldValueWrite> =
	{
		type: 'object',
		properties: {
			applicationFormFieldId: {
				type: 'integer',
			},
			position: {
				type: 'integer',
			},
			value: {
				type: 'string',
			},
		},
		required: ['applicationFormFieldId', 'position', 'value'],
	};
