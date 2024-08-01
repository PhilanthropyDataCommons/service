import { Id, JsonResultSet, ProposalFieldValue } from '../../../types';
import { db } from '../../db';

// We could use `Bundle`, but `Bundle` is primarily for pagination. This is a list.
export const loadProposalFieldValuesByBaseFieldIdAndOrganizationId = async (
	baseFieldId: Id,
	organizationId: Id,
): Promise<ProposalFieldValue[]> =>
	(
		await db.sql<JsonResultSet<ProposalFieldValue>>(
			'proposalFieldValues.selectByBaseFieldIdAndOrganizationId',
			{
				baseFieldId,
				organizationId,
			},
		)
	).rows.map((row) => row.object);
