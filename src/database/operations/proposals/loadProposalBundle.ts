import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrls } from '../../../decorators/proposal';
import type { Proposal, KeycloakId, ShortCode } from '../../../types';

const loadProposalBundle = generateLoadBundleOperation<
	Proposal,
	[
		createdBy: KeycloakId | undefined,
		changemakerId: number | undefined,
		funderShortCode: ShortCode | undefined,
		search: string | undefined,
	]
>(
	'proposals.selectWithPagination',
	'proposals',
	['createdBy', 'changemakerId', 'funderShortCode', 'search'],
	decorateWithFileDownloadUrls,
);

export { loadProposalBundle };
