import { db } from '../../db';
import type {
	JsonResultSet,
	Organization,
	WritableOrganization,
} from '../../../types';

export const createOrganization = async (
	createValues: WritableOrganization,
): Promise<Organization> => {
	const { taxId, name } = createValues;
	const result = await db.sql<JsonResultSet<Organization>>(
		'organizations.insertOne',
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
