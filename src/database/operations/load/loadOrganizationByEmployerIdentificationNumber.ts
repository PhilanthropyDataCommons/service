import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, Organization } from '../../../types';

export const loadOrganizationByEmployerIdentificationNumber = async (
	employerIdentificationNumber: string,
): Promise<Organization> => {
	const result = await db.sql<JsonResultSet<Organization>>(
		'organizations.selectByEmployerIdentificationNumber',
		{
			employerIdentificationNumber,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(
			`The organization was not found (EIN: ${employerIdentificationNumber})`,
		);
	}
	return object;
};
