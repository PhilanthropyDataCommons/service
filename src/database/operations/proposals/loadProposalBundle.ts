import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/proposal';
import type { Id, Proposal, KeycloakId, ShortCode } from '../../../types';

const loadProposalBundle = generateLoadBundleOperation<
	Proposal,
	[
		createdBy: KeycloakId | undefined,
		changemakerId: Id | undefined,
		funderShortCode: ShortCode | undefined,
		search: string | undefined,
	]
>(
	'proposals.selectWithPagination',
	['createdBy', 'changemakerId', 'funderShortCode', 'search'],
	decorateWithFileDownloadUrls,
);

export { loadProposalBundle };
