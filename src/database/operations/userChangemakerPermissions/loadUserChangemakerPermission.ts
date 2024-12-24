import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import {
	keycloakIdToString,
	type Id,
	type JsonResultSet,
	type KeycloakId,
	type Permission,
	type UserChangemakerPermission,
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
			entityType: 'UserchangemakerPermission',
			entityPrimaryKey: {
				userKeycloakUserId: keycloakIdToString(userKeycloakUserId),
				changemakerId,
				permission,
			},
		});
	}
	return object;
};
