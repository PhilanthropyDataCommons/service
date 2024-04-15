import { loadBundle } from './loadBundle';
import type { JsonResultSet, Bundle, Proposal } from '../../../types';

export const loadProposalBundle = async (queryParameters: {
	offset: number;
	limit: number;
	search?: string;
	organizationId?: number;
	createdBy?: number;
}): Promise<Bundle<Proposal>> => {
	const defaultQueryParameters = {
		search: '',
		organizationId: 0,
		createdBy: 0,
	};
	const bundle = await loadBundle<JsonResultSet<Proposal>>(
		'proposals.selectWithPagination',
		{
			...defaultQueryParameters,
			...queryParameters,
		},
		'proposals',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
