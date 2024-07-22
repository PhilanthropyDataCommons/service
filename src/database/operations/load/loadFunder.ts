import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { Funder, JsonResultSet } from '../../../types';

export const loadFunder = async (id: number): Promise<Funder> => {
	const result = await db.sql<JsonResultSet<Funder>>('funders.selectById', {
		id,
	});
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`The funder was not found (id: ${id})`);
	}
	return object;
};
