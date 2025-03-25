import { generateCreateOrUpdateItemOperation } from '../generators';
import type { ProposalVersion, WritableProposalVersion } from '../../../types';

const createProposalVersion = generateCreateOrUpdateItemOperation<
	ProposalVersion,
	WritableProposalVersion,
	[]
>(
	'proposalVersions.insertOne',
	['proposalId', 'applicationFormId', 'sourceId'],
	[],
);

export { createProposalVersion };
