import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, Proposal } from '../../../types';

export const loadProposal = async (id: number): Promise<Proposal> => {
	const result = await db.sql<JsonResultSet<Proposal>>('proposals.selectById', {
		id,
	});
	const proposal = result.rows[0]?.object;
	if (proposal === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Proposal',
			entityId: id,
		});
	}
	return proposal;
};
