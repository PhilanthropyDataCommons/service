import { db } from '../../db';
import type {
	JsonResultSet,
	Funder,
	InternallyWritableFunder,
} from '../../../types';

const createOrUpdateFunder = async (
	createValues: InternallyWritableFunder,
): Promise<Funder> => {
	const { shortCode, name, keycloakOrganizationId } = createValues;
	const result = await db.sql<JsonResultSet<Funder>>(
		'funders.insertOrUpdateOne',
		{
			shortCode,
			name,
			keycloakOrganizationId,
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

export { createOrUpdateFunder };
