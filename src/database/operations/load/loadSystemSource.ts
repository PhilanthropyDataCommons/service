import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, Source } from '../../../types';

const loadSystemSource = async (): Promise<Source> => {
	const result = await db.sql<JsonResultSet<Source>>(
		'sources.selectSystemSource',
		{},
	);
	const item = result.rows[0]?.object;
	if (item === undefined) {
		throw new NotFoundError(`The system source was not found.`);
	}
	return item;
};

export { loadSystemSource };
