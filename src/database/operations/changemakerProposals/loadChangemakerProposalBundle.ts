import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemakerProposal';
import type { ChangemakerProposal, Id } from '../../../types';

const loadChangemakerProposalBundle = generateLoadBundleOperation<
	ChangemakerProposal,
	[changemakerId: Id | undefined, proposalId: Id | undefined]
>(
	'changemakersProposals.selectWithPagination',
	['changemakerId', 'proposalId'],
	decorateWithFileDownloadUrls,
);

export { loadChangemakerProposalBundle };
