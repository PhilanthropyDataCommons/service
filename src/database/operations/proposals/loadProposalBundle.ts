import { generateLoadBundleOperation } from '../generators';
import type { Proposal, KeycloakId } from '../../../types';

const loadProposalBundle = generateLoadBundleOperation<
	Proposal,
	[
		authContextIsAdministrator: boolean | undefined,
		authContextKeycloakUserId: KeycloakId | undefined,
		createdBy: KeycloakId | undefined,
		changemakerId: number | undefined,
		search: string | undefined,
	]
>('proposals.selectWithPagination', 'proposals', [
	'authContextIsAdministrator',
	'authContextKeycloakUserId',
	'createdBy',
	'changemakerId',
	'search',
]);

export { loadProposalBundle };
