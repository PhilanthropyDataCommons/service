import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	Proposal,
	AuthContext,
	KeycloakUserId,
} from '../../../types';

export const loadProposalBundle = async (
	authContext: AuthContext | undefined,
	createdBy: KeycloakUserId | undefined,
	organizationId: number | undefined,
	search: string | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<Proposal>> => {
	const userId = authContext?.user.keycloakUserId;
	const isAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<Proposal>>(
		'proposals.selectWithPagination',
		{
			createdBy,
			isAdministrator,
			limit,
			offset,
			organizationId,
			search,
			userId,
		},
		'proposals',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
