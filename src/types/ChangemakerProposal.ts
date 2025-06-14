import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface ChangemakerProposal {
	readonly id: number;
	changemakerId: number;
	proposalId: number;
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
