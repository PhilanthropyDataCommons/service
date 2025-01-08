import { generateCreateOrUpdateItemOperation } from '../generators';
import {
	type ChangemakerProposal,
	type WritableChangemakerProposal,
} from '../../../types';

const createChangemakerProposal = generateCreateOrUpdateItemOperation<
	ChangemakerProposal,
	WritableChangemakerProposal
>('changemakersProposals.insertOne', ['changemakerId', 'proposalId']);

export { createChangemakerProposal };
