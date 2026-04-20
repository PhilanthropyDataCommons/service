import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Changemaker } from './Changemaker';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { Proposal } from './Proposal';
import type { Writable } from './Writable';

interface ChangemakerProposal {
	readonly id: Id;
	changemakerId: Id;
	proposalId: Id;
	readonly changemaker: Changemaker;
	readonly proposal: Proposal;
	readonly createdAt: string;
}

type WritableChangemakerProposal = Writable<ChangemakerProposal>;

const writableChangemakerProposalSchema: JSONSchemaType<WritableChangemakerProposal> =
	{
		type: 'object',
		properties: {
			changemakerId: idSchema,
			proposalId: idSchema,
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
