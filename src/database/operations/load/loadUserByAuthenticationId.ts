import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { JsonResultSet, type User } from '../../../types';

export const loadUserByAuthenticationId = async (
	authenticationId: string,
): Promise<User> => {
	const userQueryResult = await db.sql<JsonResultSet<User>>(
		'users.selectByAuthenticationId',
		{
			authenticationId,
		},
	);
	const { object } = userQueryResult.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(
			`The entity was not found (authenticationId: ${authenticationId})`,
		);
	}
	return object;
};
