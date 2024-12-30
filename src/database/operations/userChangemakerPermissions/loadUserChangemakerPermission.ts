import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	Id,
	JsonResultSet,
	KeycloakId,
	Permission,
	UserChangemakerPermission,
} from '../../../types';

export const loadUserChangemakerPermission = async (
	userKeycloakUserId: KeycloakId,
	changemakerId: Id,
	permission: Permission,
): Promise<UserChangemakerPermission> => {
	const result = await db.sql<JsonResultSet<UserChangemakerPermission>>(
		'userChangemakerPermissions.selectByPrimaryKey',
		{
			userKeycloakUserId,
			changemakerId,
			permission,
		},
	);
	const object = result.rows[0]?.object;
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'UserChangemakerPermission',
			entityPrimaryKey: {
				userKeycloakUserId: keycloakIdToString(userKeycloakUserId),
				changemakerId,
				permission,
			},
		});
	}
	return object;
};
