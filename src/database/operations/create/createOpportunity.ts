import { db } from '../../db';
import type {
	JsonResultSet,
	WritableOpportunity,
	Opportunity,
} from '../../../types';

export const createOpportunity = async (
	createValues: WritableOpportunity,
): Promise<Opportunity> => {
	const { title } = createValues;

	const result = await db.sql<JsonResultSet<Opportunity>>(
		'opportunities.insertOne',
		{
			title,
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
