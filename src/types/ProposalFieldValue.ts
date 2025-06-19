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
				// This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
				// See: https://github.com/ajv-validator/ajv/issues/2163
				// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
				nullable: true as false,
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
