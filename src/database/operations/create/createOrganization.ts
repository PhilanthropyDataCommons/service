import { db } from '../../db';
import type { Organization, WritableOrganization } from '../../../types';

export const createOrganization = async (
	createValues: WritableOrganization,
): Promise<Organization> => {
	const { employerIdentificationNumber, name } = createValues;
	const result = await db.sql<Organization>('organizations.insertOne', {
		employerIdentificationNumber,
		name,
	});
	const organization = result.rows[0];
	if (organization === undefined) {
		throw new Error(
			'The organization creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return organization;
};
