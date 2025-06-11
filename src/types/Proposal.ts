import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { ProposalVersion } from './ProposalVersion';
import type { Writable } from './Writable';
import type { KeycloakId } from './KeycloakId';

interface Proposal {
	readonly id: number;
	opportunityId: number;
	externalId: string;
	readonly versions: ProposalVersion[];
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type WritableProposal = Writable<Proposal>;

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
	type Proposal,
	type WritableProposal,
	writableProposalSchema,
};
