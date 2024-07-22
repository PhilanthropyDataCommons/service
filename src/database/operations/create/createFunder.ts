import { db } from '../../db';
import type { JsonResultSet, Funder, WritableFunder } from '../../../types';

export const createFunder = async (
	createValues: WritableFunder,
): Promise<Funder> => {
	const { name } = createValues;
	const result = await db.sql<JsonResultSet<Funder>>('funders.insertOne', {
		name,
	});
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};
