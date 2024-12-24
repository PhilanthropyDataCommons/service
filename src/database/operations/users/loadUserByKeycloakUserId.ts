import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type { JsonResultSet, KeycloakId, User } from '../../../types';

export const loadUserByKeycloakUserId = async (
	keycloakUserId: KeycloakId,
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
			lookupValues: { keycloakUserId: keycloakIdToString(keycloakUserId) },
		});
	}
	return object;
};
