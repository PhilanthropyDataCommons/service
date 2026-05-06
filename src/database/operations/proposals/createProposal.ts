import { generateCreateItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/proposal';
import type { Proposal, WritableProposal } from '../../../types';

const createProposal = generateCreateItemOperation<
	Proposal,
	WritableProposal,
	[]
>(
	'proposals.insertOne',
	['opportunityId', 'externalId'],
	[],
	decorateWithFileDownloadUrls,
);

export { createProposal };
