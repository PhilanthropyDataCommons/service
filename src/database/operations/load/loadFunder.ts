import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { Funder, JsonResultSet, ShortCode } from '../../../types';

export const loadFunder = async (shortCode: ShortCode): Promise<Funder> => {
	const result = await db.sql<JsonResultSet<Funder>>(
		'funders.selectByShortCode',
		{
			shortCode,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(
			`The funder was not found (short code: ${shortCode})`,
		);
	}
	return object;
};
