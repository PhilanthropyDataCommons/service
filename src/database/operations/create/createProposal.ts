import { db } from '../../db';
import { NotFoundError } from '../../../errors';
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
		throw new NotFoundError('The proposal could not be created.');
	}
	return proposal;
};
