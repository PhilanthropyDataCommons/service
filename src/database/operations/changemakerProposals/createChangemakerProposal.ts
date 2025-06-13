import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	ChangemakerProposal,
	WritableChangemakerProposal,
} from '../../../types';

const createChangemakerProposal = generateCreateOrUpdateItemOperation<
	ChangemakerProposal,
	WritableChangemakerProposal,
	[]
>('changemakersProposals.insertOne', ['changemakerId', 'proposalId'], []);

export { createChangemakerProposal };
