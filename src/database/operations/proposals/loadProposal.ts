import { generateLoadItemOperation } from '../generators';
import type { Id, Proposal } from '../../../types';

const loadProposal = generateLoadItemOperation<Proposal, [proposalId: Id]>(
	'proposals.selectById',
	'Proposal',
	['proposalId'],
);

export { loadProposal };
