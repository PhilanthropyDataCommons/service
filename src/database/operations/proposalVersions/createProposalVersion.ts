import { generateCreateItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/proposalVersion';
import type { ProposalVersion, WritableProposalVersion } from '../../../types';

const createProposalVersion = generateCreateItemOperation<
	ProposalVersion,
	WritableProposalVersion,
	[]
>(
	'proposalVersions.insertOne',
	['proposalId', 'applicationFormId', 'sourceId'],
	[],
	decorateWithFileDownloadUrls,
);

export { createProposalVersion };
