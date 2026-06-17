import { generateLoadItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/proposalFieldValue';
import type { Id, ProposalFieldValue } from '../../../types';

const loadProposalFieldValue = generateLoadItemOperation<
	ProposalFieldValue,
	[proposalFieldValueId: Id]
>(
	'proposalFieldValues.selectById',
	'ProposalFieldValue',
	['proposalFieldValueId'],
	decorateWithFileDownloadUrl,
);

export { loadProposalFieldValue };
