import { generateLoadItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/proposalVersion';
import type { Id, ProposalVersion } from '../../../types';

const loadProposalVersion = generateLoadItemOperation<
	ProposalVersion,
	[proposalVersionId: Id]
>(
	'proposalVersions.selectById',
	'ProposalVersion',
	['proposalVersionId'],
	decorateWithFileDownloadUrls,
);

export { loadProposalVersion };
