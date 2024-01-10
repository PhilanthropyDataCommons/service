import { ajv } from '../ajv';
import { proposalVersionSchema } from './ProposalVersion';
import type { JSONSchemaType } from 'ajv';
import type { ProposalVersion } from './ProposalVersion';

export interface Proposal {
	id: number;
	applicantId: number;
	opportunityId: number;
	externalId: string;
	versions?: ProposalVersion[];
	createdAt: Date;
}

export type ProposalWrite = Omit<Proposal, 'createdAt' | 'id' | 'versions'>;

export const proposalSchema: JSONSchemaType<Proposal> = {
	type: 'object',
	properties: {
		id: {
			type: 'integer',
		},
		applicantId: {
			type: 'integer',
		},
		opportunityId: {
			type: 'integer',
		},
		externalId: {
			type: 'string',
			pattern: '.+',
		},
		versions: {
			type: 'array',
			items: proposalVersionSchema,
			nullable: true,
		},
		createdAt: {
			type: 'object',
			required: [],
			instanceof: 'Date',
		},
	},
	required: ['id', 'applicantId', 'opportunityId', 'externalId', 'createdAt'],
};

export const proposalWriteSchema: JSONSchemaType<ProposalWrite> = {
	type: 'object',
	properties: {
		applicantId: {
			type: 'integer',
		},
		opportunityId: {
			type: 'integer',
		},
		externalId: {
			type: 'string',
			pattern: '.+',
		},
	},
	required: ['applicantId', 'opportunityId', 'externalId'],
};

export const isProposal = ajv.compile(proposalSchema);

export const isProposalWrite = ajv.compile(proposalWriteSchema);
