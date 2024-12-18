import { db } from '../../db';
import type {
	JsonResultSet,
	DataProvider,
	InternallyWritableDataProvider,
} from '../../../types';

const createOrUpdateDataProvider = async (
	createValues: InternallyWritableDataProvider,
): Promise<DataProvider> => {
	const { shortCode, name, keycloakOrganizationId } = createValues;
	const result = await db.sql<JsonResultSet<DataProvider>>(
		'dataProviders.insertOrUpdateOne',
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

export { createOrUpdateDataProvider };
