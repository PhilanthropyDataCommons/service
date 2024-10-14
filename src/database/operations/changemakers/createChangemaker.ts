import { db } from '../../db';
import type {
	JsonResultSet,
	Changemaker,
	WritableChangemaker,
} from '../../../types';

export const createChangemaker = async (
	createValues: WritableChangemaker,
): Promise<Changemaker> => {
	const { taxId, name } = createValues;
	const result = await db.sql<JsonResultSet<Changemaker>>(
		'changemakers.insertOne',
		{
			taxId,
			name,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};
