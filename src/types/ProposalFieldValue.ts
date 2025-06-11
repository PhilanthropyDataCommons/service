import type { JSONSchemaType } from 'ajv';
import type { ApplicationFormField } from './ApplicationFormField';
import type { Writable } from './Writable';

interface ProposalFieldValue {
	readonly id: number;
	proposalVersionId: number;
	applicationFormFieldId: number;
	position: number;
	value: string;
	goodAsOf: string | null;
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
			goodAsOf: {
				type: 'string',
				nullable: true as false, // see https://github.com/ajv-validator/ajv/issues/2163
			},
		},
		required: ['applicationFormFieldId', 'position', 'value', 'goodAsOf'],
	};

type InternallyWritableProposalFieldValue = WritableProposalFieldValue &
	Pick<ProposalFieldValue, 'isValid'>;

export {
	type InternallyWritableProposalFieldValue,
	type ProposalFieldValue,
	type WritableProposalFieldValueWithProposalVersionContext,
	writableProposalFieldValueWithProposalVersionContextSchema,
};
