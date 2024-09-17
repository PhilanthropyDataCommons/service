import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, Source } from '../../../types';

export const loadSource = async (id: number): Promise<Source> => {
	const result = await db.sql<JsonResultSet<Source>>('sources.selectById', {
		id,
	});
	const item = result.rows[0]?.object;
	if (item === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Source',
			entityId: id,
		});
	}
	return item;
};
