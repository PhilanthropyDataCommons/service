import { ajv } from '../ajv';
import { writableProposalFieldValueWithProposalVersionContextSchema } from './ProposalFieldValue';
import type { JSONSchemaType } from 'ajv';
import type {
	ProposalFieldValue,
	WritableProposalFieldValueWithProposalVersionContext,
} from './ProposalFieldValue';

export interface ProposalVersion {
	id: number;
	proposalId: number;
	applicationFormId: number;
	version: number;
	fieldValues: ProposalFieldValue[];
	createdAt: string;
}

export type ProposalVersionWrite = Omit<
	ProposalVersion,
	'createdAt' | 'fieldValues' | 'id' | 'version'
> & { fieldValues: WritableProposalFieldValueWithProposalVersionContext[] };

export const proposalVersionWriteSchema: JSONSchemaType<ProposalVersionWrite> =
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

export const isProposalVersionWrite = ajv.compile(proposalVersionWriteSchema);
