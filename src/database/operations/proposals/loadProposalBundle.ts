import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	Proposal,
	AuthContext,
} from '../../../types';

export const loadProposalBundle = async (
	queryParameters: {
		offset: number;
		limit: number;
		search?: string;
		organizationId?: number;
		createdBy?: number;
	},
	authContext?: AuthContext,
): Promise<Bundle<Proposal>> => {
	const defaultQueryParameters = {
		search: '',
		organizationId: 0,
		createdBy: 0,
		userId: 0,
		isAdministrator: false,
	};
	const { offset, limit, search, organizationId, createdBy } = queryParameters;
	const userId = authContext?.user.id;
	const isAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<Proposal>>(
		'proposals.selectWithPagination',
		{
			...defaultQueryParameters,
			offset,
			limit,
			search,
			organizationId,
			createdBy,
			userId,
			isAdministrator,
		},
		'proposals',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
