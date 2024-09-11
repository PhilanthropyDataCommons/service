import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { Id, JsonResultSet, Organization } from '../../../types';

export const loadOrganization = async (
	id: Id,
	authenticationId?: string,
): Promise<Organization> => {
	const result = await db.sql<JsonResultSet<Organization>>(
		'organizations.selectById',
		{
			id,
			authenticationId,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`The organization was not found (id: ${id})`);
	}
	return object;
};
