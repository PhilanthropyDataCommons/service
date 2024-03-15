import { db } from '../../db';
import type { Proposal, JsonResultSet, WritableProposal } from '../../../types';

export const createProposal = async (
	createValues: WritableProposal,
): Promise<Proposal> => {
	const { opportunityId, externalId } = createValues;
	const result = await db.sql<JsonResultSet<Proposal>>('proposals.insertOne', {
		opportunityId,
		externalId,
	});
	const proposal = result.rows[0]?.object;
	if (proposal === undefined) {
		throw new Error(
			'The proposal creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return proposal;
};
