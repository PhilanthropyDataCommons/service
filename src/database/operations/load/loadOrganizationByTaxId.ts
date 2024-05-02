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
		throw new NotFoundError(
			`The organization was not found (Tax ID: ${taxId})`,
		);
	}
	return object;
};
