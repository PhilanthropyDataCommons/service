import { db } from '../../db';
import type {
	Proposal,
	JsonResultSet,
	InternallyWritableProposal,
} from '../../../types';

export const createProposal = async (
	createValues: InternallyWritableProposal,
): Promise<Proposal> => {
	const { opportunityId, externalId, createdBy } = createValues;
	const result = await db.sql<JsonResultSet<Proposal>>('proposals.insertOne', {
		opportunityId,
		externalId,
		createdBy,
	});
	const proposal = result.rows[0]?.object;
	if (proposal === undefined) {
		throw new Error(
			'The proposal creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return proposal;
};
