import { ajv } from '../ajv';
import { proposalFieldValueWriteSchema } from './ProposalFieldValue';
import type { JSONSchemaType } from 'ajv';
import type {
	ProposalFieldValue,
	ProposalFieldValueWrite,
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
> & { fieldValues: ProposalFieldValueWrite[] };

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
				items: proposalFieldValueWriteSchema,
			},
		},
		required: ['proposalId', 'applicationFormId', 'fieldValues'],
	};

export const isProposalVersionWrite = ajv.compile(proposalVersionWriteSchema);
