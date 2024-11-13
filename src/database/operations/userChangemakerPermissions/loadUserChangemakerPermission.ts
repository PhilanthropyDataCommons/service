import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import {
	keycloakUserIdToString,
	type Id,
	type JsonResultSet,
	type KeycloakUserId,
	type Permission,
	type UserChangemakerPermission,
} from '../../../types';

export const loadUserChangemakerPermission = async (
	userKeycloakUserId: KeycloakUserId,
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
			entityType: 'UserchangemakerPermission',
			entityPrimaryKey: {
				userKeycloakUserId: keycloakUserIdToString(userKeycloakUserId),
				changemakerId,
				permission,
			},
		});
	}
	return object;
};
