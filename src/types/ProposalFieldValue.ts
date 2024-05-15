import type { JSONSchemaType } from 'ajv';
import type { ApplicationFormField } from './ApplicationFormField';
import type { Writable } from './Writable';

interface ProposalFieldValue {
	readonly id: number;
	proposalVersionId: number;
	applicationFormFieldId: number;
	position: number;
	value: string;
	readonly createdAt: string;
	readonly applicationFormField: ApplicationFormField;
	readonly isValid: boolean;
}

type WritableProposalFieldValue = Writable<ProposalFieldValue>;

type WritableProposalFieldValueWithProposalVersionContext = Omit<
	WritableProposalFieldValue,
	'proposalVersionId'
>;

const writableProposalFieldValueWithProposalVersionContextSchema: JSONSchemaType<WritableProposalFieldValueWithProposalVersionContext> =
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

type InternallyWritableProposalFieldValue = WritableProposalFieldValue &
	Pick<ProposalFieldValue, 'isValid'>;

export {
	InternallyWritableProposalFieldValue,
	ProposalFieldValue,
	WritableProposalFieldValueWithProposalVersionContext,
	writableProposalFieldValueWithProposalVersionContextSchema,
};
