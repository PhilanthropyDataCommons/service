import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { DataProvider, JsonResultSet } from '../../../types';

const loadSystemDataProvider = async (): Promise<DataProvider> => {
	const result = await db.sql<JsonResultSet<DataProvider>>(
		'dataProviders.selectSystemDataProvider',
		{},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`The system data provider was not found`);
	}
	return object;
};

export { loadSystemDataProvider };
