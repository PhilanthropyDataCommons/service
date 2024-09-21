import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	OrganizationProposal,
} from '../../../types';

export const loadOrganizationProposalBundle = async (
	organizationId: number | undefined,
	proposalId: number | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<OrganizationProposal>> => {
	const bundle = await loadBundle<JsonResultSet<OrganizationProposal>>(
		'organizationsProposals.selectWithPagination',
		{
			organizationId,
			proposalId,
			offset,
			limit,
		},
		'organizations_proposals',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
