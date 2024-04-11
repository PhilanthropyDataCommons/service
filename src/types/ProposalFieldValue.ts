import type { JSONSchemaType } from 'ajv';
import type { ApplicationFormField } from './ApplicationFormField';

interface ProposalFieldValue {
	readonly id: number;
	proposalVersionId: number;
	applicationFormFieldId: number;
	position: number;
	value: string;
	readonly createdAt: string;
	readonly applicationFormField?: ApplicationFormField;
	readonly isValid: boolean;
}

type ProposalFieldValueWrite = Omit<
	ProposalFieldValue,
	'applicationFormField' | 'createdAt' | 'id' | 'proposalVersionId' | 'isValid'
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

export { ProposalFieldValue, ProposalFieldValueWrite };
