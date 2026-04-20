import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { ApplicationFormField } from './ApplicationFormField';
import type { FieldValueBase } from './FieldValueBase';
import type { Writable } from './Writable';

interface ProposalFieldValue extends FieldValueBase {
	proposalVersionId: Id;
	applicationFormFieldId: Id;
	position: number;
	readonly applicationFormField: ApplicationFormField;
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
			applicationFormFieldId: idSchema,
			position: {
				type: 'integer',
			},
			value: {
				type: 'string',
			},
			goodAsOf: {
				type: 'string',
				/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
				 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
				 * See: https://github.com/ajv-validator/ajv/issues/2163
				 */
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
