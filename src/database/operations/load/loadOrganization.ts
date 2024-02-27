import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { Organization } from '../../../types';

export const loadOrganization = async (id: number): Promise<Organization> => {
	const organizationsQueryResult = await db.sql<Organization>(
		'organizations.selectById',
		{
			id,
		},
	);
	const organization = organizationsQueryResult.rows[0];
	if (organization === undefined) {
		throw new NotFoundError(`The organization was not found (id: ${id})`);
	}
	return organization;
};
