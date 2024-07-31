import { Id, JsonResultSet, ProposalFieldValue } from '../../../types';
import { db } from '../../db';

// We could use `Bundle`, but `Bundle` is primarily for pagination. This is a list.
export const loadProposalFieldValuesByBaseFieldId = async (
	baseFieldId: Id,
): Promise<ProposalFieldValue[]> =>
	(
		await db.sql<JsonResultSet<ProposalFieldValue>>(
			'proposalFieldValues.selectByBaseFieldId',
			{
				baseFieldId,
			},
		)
	).rows.map((row) => row.object);
