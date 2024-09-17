import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, Organization } from '../../../types';

export const loadOrganizationByTaxId = async (
	taxId: string,
): Promise<Organization> => {
	const result = await db.sql<JsonResultSet<Organization>>(
		'organizations.selectByTaxId',
		{
			taxId,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Organization',
			lookupValues: {
				taxId,
			},
		});
	}
	return object;
};
