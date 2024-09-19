import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, Opportunity } from '../../../types';

const loadOpportunity = async (id: number): Promise<Opportunity> => {
	const result = await db.sql<JsonResultSet<Opportunity>>(
		'opportunities.selectById',
		{
			id,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Opportunity',
			entityId: id,
		});
	}
	return object;
};

export { loadOpportunity };
