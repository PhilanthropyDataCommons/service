import { generateCreateItemOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/changemakerProposal';
import type {
	ChangemakerProposal,
	WritableChangemakerProposal,
} from '../../../types';

const createChangemakerProposal = generateCreateItemOperation<
	ChangemakerProposal,
	WritableChangemakerProposal,
	[]
>(
	'changemakersProposals.insertOne',
	['changemakerId', 'proposalId'],
	[],
	decorateWithFileDownloadUrls,
);

export { createChangemakerProposal };
