import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface OrganizationProposal {
	readonly id: number;
	organizationId: number;
	proposalId: number;
	readonly createdAt: Date;
}

type WritableOrganizationProposal = Writable<OrganizationProposal>;

const writableOrganizationProposalSchema: JSONSchemaType<WritableOrganizationProposal> =
	{
		type: 'object',
		properties: {
			organizationId: {
				type: 'number',
			},
			proposalId: {
				type: 'number',
			},
		},
		required: ['organizationId', 'proposalId'],
	};

const isWritableOrganizationProposal = ajv.compile(
	writableOrganizationProposalSchema,
);

export {
	isWritableOrganizationProposal,
	OrganizationProposal,
	WritableOrganizationProposal,
	writableOrganizationProposalSchema,
};
