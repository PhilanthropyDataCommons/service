import { loadBundle } from './loadBundle';
import type { TinyPgParams } from 'tinypg';
import type { JsonResultSet, Bundle, Proposal } from '../../../types';

export const loadProposalBundle = async (
	queryParameters: TinyPgParams,
): Promise<Bundle<Proposal>> => {
	const bundle = await loadBundle<JsonResultSet<Proposal>>(
		'proposals.selectWithPagination',
		queryParameters,
		'proposals',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
