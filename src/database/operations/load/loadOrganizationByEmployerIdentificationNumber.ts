import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { Organization } from '../../../types';

export const loadOrganizationByEmployerIdentificationNumber = async (
	employerIdentificationNumber: string,
): Promise<Organization> => {
	const organizationsQueryResult = await db.sql<Organization>(
		'organizations.selectByEmployerIdentificationNumber',
		{
			employerIdentificationNumber,
		},
	);
	const organization = organizationsQueryResult.rows[0];
	if (organization === undefined) {
		throw new NotFoundError(
			`The organization was not found (employer_identification_number: ${employerIdentificationNumber})`,
		);
	}
	return organization;
};
