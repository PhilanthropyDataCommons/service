import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { DataProvider, JsonResultSet } from '../../../types';

const loadDataProvider = async (id: number): Promise<DataProvider> => {
	const result = await db.sql<JsonResultSet<DataProvider>>(
		'dataProviders.selectById',
		{
			id,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`The item was not found (id: ${id})`);
	}
	return object;
};

export { loadDataProvider };
