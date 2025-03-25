import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Proposal, WritableProposal } from '../../../types';

const createProposal = generateCreateOrUpdateItemOperation<
	Proposal,
	WritableProposal,
	[]
>('proposals.insertOne', ['opportunityId', 'externalId'], []);

export { createProposal };
