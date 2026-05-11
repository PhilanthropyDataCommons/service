import { generateCreateItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/proposalFieldValue';
import type {
	ProposalFieldValue,
	InternallyWritableProposalFieldValue,
} from '../../../types';

const createProposalFieldValue = generateCreateItemOperation<
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
