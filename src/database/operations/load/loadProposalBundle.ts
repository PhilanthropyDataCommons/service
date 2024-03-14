import { loadBundle } from './loadBundle';
import type { TinyPgParams } from 'tinypg';
import type { Bundle, Proposal } from '../../../types';

export const loadProposalBundle = async (
	queryParameters: TinyPgParams,
): Promise<Bundle<Proposal>> => {
	const bundle = await loadBundle<Proposal>(
		'proposals.selectWithPagination',
		queryParameters,
		'proposals',
	);
	return bundle;
};
