import { generateLoadItemOperation } from '../generators';
import type { Id, ProposalVersion } from '../../../types';

const loadProposalVersion = generateLoadItemOperation<
	ProposalVersion,
	[proposalVersionId: Id]
>('proposalVersions.selectById', 'ProposalVersion', ['proposalVersionId']);

export { loadProposalVersion };
