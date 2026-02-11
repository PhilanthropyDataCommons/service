import { ajv } from '../ajv';
import type { Changemaker } from './Changemaker';
import type { JSONSchemaType } from 'ajv';
import type { Proposal } from './Proposal';
import type { Writable } from './Writable';

interface ChangemakerProposal {
	readonly id: number;
	changemakerId: number;
	proposalId: number;
	readonly changemaker: Changemaker;
	readonly proposal: Proposal;
	readonly createdAt: string;
}

type WritableChangemakerProposal = Writable<ChangemakerProposal>;

const writableChangemakerProposalSchema: JSONSchemaType<WritableChangemakerProposal> =
	{
		type: 'object',
		properties: {
			changemakerId: {
				type: 'number',
			},
			proposalId: {
				type: 'number',
			},
		},
		required: ['changemakerId', 'proposalId'],
	};

const isWritableChangemakerProposal = ajv.compile(
	writableChangemakerProposalSchema,
);

export {
	isWritableChangemakerProposal,
	type ChangemakerProposal,
	type WritableChangemakerProposal,
	writableChangemakerProposalSchema,
};
