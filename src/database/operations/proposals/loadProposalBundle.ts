import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	Proposal,
	AuthContext,
	KeycloakId,
} from '../../../types';

export const loadProposalBundle = async (
	authContext: AuthContext | undefined,
	createdBy: KeycloakId | undefined,
	changemakerId: number | undefined,
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
			changemakerId,
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
