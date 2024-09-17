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
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Source',
			lookupValues: {
				specialQuery: 'selectSystemSource',
			},
		});
	}
	return item;
};

export { loadSystemSource };
