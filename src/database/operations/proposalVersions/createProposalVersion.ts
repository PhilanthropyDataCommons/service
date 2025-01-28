import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	ProposalVersion,
	InternallyWritableProposalVersion,
} from '../../../types';

const createProposalVersion = generateCreateOrUpdateItemOperation<
	ProposalVersion,
	InternallyWritableProposalVersion,
	[]
>(
	'proposalVersions.insertOne',
	['proposalId', 'applicationFormId', 'sourceId', 'createdBy'],
	[],
);

export { createProposalVersion };
