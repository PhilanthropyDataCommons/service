import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	OrganizationProposal,
} from '../../../types';

interface LoadOrganizationProposalBundleParameters {
	organizationId?: number;
	proposalId?: number;
	offset: number;
	limit: number;
}

export const loadOrganizationProposalBundle = async (
	queryParameters: LoadOrganizationProposalBundleParameters,
): Promise<Bundle<OrganizationProposal>> => {
	const { organizationId, proposalId, offset, limit } = queryParameters;
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
