import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { DataProvider, JsonResultSet, ShortCode } from '../../../types';

const loadDataProvider = async (
	shortCode: ShortCode,
): Promise<DataProvider> => {
	const result = await db.sql<JsonResultSet<DataProvider>>(
		'dataProviders.selectByShortCode',
		{
			shortCode,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'DataProvider',
			entityShortCode: shortCode,
		});
	}
	return object;
};

export { loadDataProvider };
