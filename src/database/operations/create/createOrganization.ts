import { db } from '../../db';
import { NotFoundError } from '../../../errors';
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
		throw new NotFoundError('The organization could not be created.');
	}
	return organization;
};
