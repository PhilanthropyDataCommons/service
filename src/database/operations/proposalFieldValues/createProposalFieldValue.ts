import { generateCreateOrUpdateItemOperation } from '../generators';
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
	],
	[],
);

export { createProposalFieldValue };
