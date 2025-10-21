import { generateLoadItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/proposal';
import type { Id, Proposal } from '../../../types';

const loadProposal = generateLoadItemOperation<Proposal, [proposalId: Id]>(
	'proposals.selectById',
	'Proposal',
	['proposalId'],
	decorateWithFileDownloadUrls,
);

export { loadProposal };
