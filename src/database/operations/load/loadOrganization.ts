import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, Organization } from '../../../types';

export const loadOrganization = async (id: number): Promise<Organization> => {
	const result = await db.sql<JsonResultSet<Organization>>(
		'organizations.selectById',
		{
			id,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`The organization was not found (id: ${id})`);
	}
	return object;
};
