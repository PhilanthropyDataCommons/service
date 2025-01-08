import { generateLoadBundleOperation } from '../generators';
import type { Proposal, KeycloakId } from '../../../types';

const loadProposalBundle = generateLoadBundleOperation<
	Proposal,
	[
		createdBy: KeycloakId | undefined,
		changemakerId: number | undefined,
		search: string | undefined,
	]
>('proposals.selectWithPagination', 'proposals', [
	'createdBy',
	'changemakerId',
	'search',
]);

export { loadProposalBundle };
