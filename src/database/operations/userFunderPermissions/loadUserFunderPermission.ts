import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	JsonResultSet,
	KeycloakId,
	Permission,
	ShortCode,
	UserFunderPermission,
} from '../../../types';

export const loadUserFunderPermission = async (
	userKeycloakUserId: KeycloakId,
	funderShortCode: ShortCode,
	permission: Permission,
): Promise<UserFunderPermission> => {
	const result = await db.sql<JsonResultSet<UserFunderPermission>>(
		'userFunderPermissions.selectByPrimaryKey',
		{
			userKeycloakUserId,
			funderShortCode,
			permission,
		},
	);
	const object = result.rows[0]?.object;
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'UserFunderPermission',
			entityPrimaryKey: {
				userKeycloakUserId: keycloakIdToString(userKeycloakUserId),
				funderShortCode,
				permission,
			},
		});
	}
	return object;
};
