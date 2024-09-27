import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakUserIdToString } from '../../../types';
import type { JsonResultSet, KeycloakUserId, User } from '../../../types';

export const loadUserByKeycloakUserId = async (
	keycloakUserId: KeycloakUserId,
): Promise<User> => {
	const userQueryResult = await db.sql<JsonResultSet<User>>(
		'users.selectByKeycloakUserId',
		{
			keycloakUserId,
		},
	);
	const { object } = userQueryResult.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'User',
			lookupValues: { keycloakUserId: keycloakUserIdToString(keycloakUserId) },
		});
	}
	return object;
};
