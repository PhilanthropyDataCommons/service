import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { ShallowChangemaker } from './Changemaker';
import type { ProposalVersion } from './ProposalVersion';
import type { Writable } from './Writable';
import type { KeycloakId } from './KeycloakId';
import type { Opportunity } from './Opportunity';

interface Proposal {
	readonly id: Id;
	opportunityId: Id;
	readonly opportunity: Opportunity;
	externalId: string;
	readonly versions: ProposalVersion[];
	readonly changemakers: ShallowChangemaker[];
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type WritableProposal = Writable<Proposal>;

const writableProposalSchema: JSONSchemaType<WritableProposal> = {
	type: 'object',
	properties: {
		opportunityId: idSchema,
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
