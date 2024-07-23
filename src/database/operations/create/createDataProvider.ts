import { db } from '../../db';
import type {
	JsonResultSet,
	DataProvider,
	WritableDataProvider,
} from '../../../types';

export const createDataProvider = async (
	createValues: WritableDataProvider,
): Promise<DataProvider> => {
	const { name } = createValues;
	const result = await db.sql<JsonResultSet<DataProvider>>(
		'dataProviders.insertOne',
		{
			name,
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
