import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { getKeycloakUserIdFromAuthContext } from '../../../types';
import type {
	AuthContext,
	Id,
	JsonResultSet,
	Changemaker,
} from '../../../types';

export const loadChangemaker = async (
	authContext: AuthContext | undefined,
	id: Id,
): Promise<Changemaker> => {
	const authContextKeycloakUserId = getKeycloakUserIdFromAuthContext(authContext);
	const result = await db.sql<JsonResultSet<Changemaker>>(
		'changemakers.selectById',
		{
			id,
			authContextKeycloakUserId,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Changemaker',
			entityId: id,
		});
	}
	return object;
};
