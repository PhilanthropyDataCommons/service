import { ajv } from '../ajv';
import { writableProposalFieldValueWithProposalVersionContextSchema } from './ProposalFieldValue';
import type { JSONSchemaType } from 'ajv';
import type {
	ProposalFieldValue,
	WritableProposalFieldValueWithProposalVersionContext,
} from './ProposalFieldValue';
import type { Writable } from './Writable';
import type { Source } from './Source';

interface ProposalVersion {
	readonly id: number;
	proposalId: number;
	readonly sourceId: number;
	readonly source: Source;
	readonly version: number;
	applicationFormId: number;
	readonly fieldValues: ProposalFieldValue[];
	readonly createdAt: string;
}

type WritableProposalVersion = Writable<ProposalVersion>;

type InternallyWritableProposalVersion = WritableProposalVersion &
	Pick<ProposalVersion, 'sourceId'>;

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
	InternallyWritableProposalVersion,
	ProposalVersion,
	WritableProposalVersionWithFieldValues,
	isWritableProposalVersionWithFieldValues,
};
