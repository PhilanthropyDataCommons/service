import { ajv } from '../ajv';
import { writableProposalFieldValueWithProposalVersionContextSchema } from './ProposalFieldValue';
import type { JSONSchemaType } from 'ajv';
import type {
	ProposalFieldValue,
	WritableProposalFieldValueWithProposalVersionContext,
} from './ProposalFieldValue';
import type { Writable } from './Writable';

interface ProposalVersion {
	readonly id: number;
	proposalId: number;
	readonly version: number;
	applicationFormId: number;
	readonly fieldValues: ProposalFieldValue[];
	readonly createdAt: string;
}

type WritableProposalVersion = Writable<ProposalVersion>;

type WritableProposalVersionWithFieldValues = WritableProposalVersion & {
	fieldValues: WritableProposalFieldValueWithProposalVersionContext[];
};

const writableProposalVersionWithFieldValuesSchema: JSONSchemaType<WritableProposalVersionWithFieldValues> =
	{
		type: 'object',
		properties: {
			proposalId: {
				type: 'integer',
			},
			applicationFormId: {
				type: 'integer',
			},
			fieldValues: {
				type: 'array',
				items: writableProposalFieldValueWithProposalVersionContextSchema,
			},
		},
		required: ['proposalId', 'applicationFormId', 'fieldValues'],
	};

const isWritableProposalVersionWithFieldValues = ajv.compile(
	writableProposalVersionWithFieldValuesSchema,
);

export {
	ProposalVersion,
	WritableProposalVersion,
	WritableProposalVersionWithFieldValues,
	isWritableProposalVersionWithFieldValues,
};
