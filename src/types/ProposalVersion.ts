import { ajv } from '../ajv';
import { writableProposalFieldValueWithProposalVersionContextSchema } from './ProposalFieldValue';
import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type {
	ProposalFieldValue,
	WritableProposalFieldValueWithProposalVersionContext,
} from './ProposalFieldValue';
import type { Writable } from './Writable';
import type { Source } from './Source';
import type { KeycloakId } from './KeycloakId';

interface ProposalVersion {
	readonly id: Id;
	proposalId: Id;
	sourceId: Id;
	readonly source: Source;
	readonly version: number;
	applicationFormId: Id;
	readonly fieldValues: ProposalFieldValue[];
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type WritableProposalVersion = Writable<ProposalVersion>;

type WritableProposalVersionWithFieldValues = WritableProposalVersion & {
	fieldValues: WritableProposalFieldValueWithProposalVersionContext[];
};

const writableProposalVersionWithFieldValuesSchema: JSONSchemaType<WritableProposalVersionWithFieldValues> =
	{
		type: 'object',
		properties: {
			proposalId: idSchema,
			sourceId: idSchema,
			applicationFormId: idSchema,
			fieldValues: {
				type: 'array',
				items: writableProposalFieldValueWithProposalVersionContextSchema,
			},
		},
		required: ['proposalId', 'sourceId', 'applicationFormId', 'fieldValues'],
	};

const isWritableProposalVersionWithFieldValues = ajv.compile(
	writableProposalVersionWithFieldValuesSchema,
);

export {
	type ProposalVersion,
	type WritableProposalVersion,
	type WritableProposalVersionWithFieldValues,
	isWritableProposalVersionWithFieldValues,
};
