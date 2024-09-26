import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, User } from '../../../types';

const loadSystemUser = async (): Promise<User> => {
	const result = await db.sql<JsonResultSet<User>>(
		'users.selectSystemUser',
		{},
	);
	const item = result.rows[0]?.object;
	if (item === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'User',
			lookupValues: {
				specialQuery: 'selectSystemUser',
			},
		});
	}
	return item;
};

export { loadSystemUser };
