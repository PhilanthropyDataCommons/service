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
	const authContextKeycloakUserId = authContext?.user.keycloakUserId;
	const authContextIsAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<Proposal>>(
		'proposals.selectWithPagination',
		{
			authContextIsAdministrator,
			authContextKeycloakUserId,
			createdBy,
			limit,
			offset,
			organizationId,
			search,
		},
		'proposals',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
