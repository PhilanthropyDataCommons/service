import { generateLoadBundleOperation } from '../generators';
import type { ChangemakerProposal } from '../../../types';

const loadChangemakerProposalBundle = generateLoadBundleOperation<
	ChangemakerProposal,
	[changemakerId: number | undefined, proposalId: number | undefined]
>('changemakersProposals.selectWithPagination', 'changemakers_proposals', [
	'changemakerId',
	'proposalId',
]);

export { loadChangemakerProposalBundle };
