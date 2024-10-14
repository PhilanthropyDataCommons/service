import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	ChangemakerProposal,
} from '../../../types';

export const loadChangemakerProposalBundle = async (
	changemakerId: number | undefined,
	proposalId: number | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<ChangemakerProposal>> => {
	const bundle = await loadBundle<JsonResultSet<ChangemakerProposal>>(
		'changemakersProposals.selectWithPagination',
		{
			changemakerId,
			proposalId,
			offset,
			limit,
		},
		'changemakers_proposals',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
