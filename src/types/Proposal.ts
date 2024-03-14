import { ajv } from '../ajv';
import { proposalVersionSchema } from './ProposalVersion';
import type { JSONSchemaType } from 'ajv';
import type { ProposalVersion } from './ProposalVersion';
import type { Writable } from './Writable';

interface Proposal {
	readonly id: number;
	opportunityId: number;
	externalId: string;
	readonly versions?: ProposalVersion[];
	readonly createdAt: Date;
}

type WritableProposal = Writable<Proposal>;

const proposalSchema: JSONSchemaType<Proposal> = {
	type: 'object',
	properties: {
		id: {
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
	required: ['id', 'opportunityId', 'externalId', 'createdAt'],
};

const writableProposalSchema: JSONSchemaType<WritableProposal> = {
	type: 'object',
	properties: {
		opportunityId: {
			type: 'integer',
		},
		externalId: {
			type: 'string',
			pattern: '.+',
		},
	},
	required: ['opportunityId', 'externalId'],
};

const isProposal = ajv.compile(proposalSchema);

const isWritableProposal = ajv.compile(writableProposalSchema);

export {
	isProposal,
	isWritableProposal,
	Proposal,
	proposalSchema,
	WritableProposal,
	writableProposalSchema,
};
