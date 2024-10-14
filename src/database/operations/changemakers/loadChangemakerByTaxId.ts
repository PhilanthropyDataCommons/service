import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, Changemaker } from '../../../types';

export const loadChangemakerByTaxId = async (
	taxId: string,
): Promise<Changemaker> => {
	const result = await db.sql<JsonResultSet<Changemaker>>(
		'changemakers.selectByTaxId',
		{
			taxId,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Changemaker',
			lookupValues: {
				taxId,
			},
		});
	}
	return object;
};
