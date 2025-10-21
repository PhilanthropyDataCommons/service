import { generateCreateOrUpdateItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/proposalFieldValue';
import type {
	ProposalFieldValue,
	InternallyWritableProposalFieldValue,
} from '../../../types';

const createProposalFieldValue = generateCreateOrUpdateItemOperation<
	ProposalFieldValue,
	InternallyWritableProposalFieldValue,
	[]
>(
	'proposalFieldValues.insertOne',
	[
		'proposalVersionId',
		'applicationFormFieldId',
		'position',
		'value',
		'isValid',
		'goodAsOf',
	],
	[],
	decorateWithFileDownloadUrl,
);

export { createProposalFieldValue };
