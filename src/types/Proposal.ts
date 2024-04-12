import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { ProposalVersion } from './ProposalVersion';
import type { Writable } from './Writable';

interface Proposal {
	readonly id: number;
	opportunityId: number;
	externalId: string;
	readonly versions?: ProposalVersion[];
	readonly createdAt: string;
	readonly createdBy: number;
}

type WritableProposal = Writable<Proposal>;

type InternallyWritableProposal = WritableProposal &
	Pick<Proposal, 'createdBy'>;

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

const isWritableProposal = ajv.compile(writableProposalSchema);

export {
	isWritableProposal,
	InternallyWritableProposal,
	Proposal,
	WritableProposal,
	writableProposalSchema,
};
