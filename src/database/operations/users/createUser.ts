import { db } from '../../db';
import type { User, JsonResultSet, WritableUser } from '../../../types';

export const createUser = async (createValues: WritableUser): Promise<User> => {
	const { keycloakUserId } = createValues;
	const result = await db.sql<JsonResultSet<User>>('users.insertOne', {
		keycloakUserId,
	});
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};
