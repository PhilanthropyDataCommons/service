import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Proposal, InternallyWritableProposal } from '../../../types';

const createProposal = generateCreateOrUpdateItemOperation<
	Proposal,
	InternallyWritableProposal
>('proposals.insertOne', ['opportunityId', 'externalId', 'createdBy']);

export { createProposal };
