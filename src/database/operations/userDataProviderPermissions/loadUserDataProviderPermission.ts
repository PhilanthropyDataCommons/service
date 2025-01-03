import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	JsonResultSet,
	KeycloakId,
	Permission,
	ShortCode,
	UserDataProviderPermission,
} from '../../../types';

const loadUserDataProviderPermission = async (
	userKeycloakUserId: KeycloakId,
	dataProviderShortCode: ShortCode,
	permission: Permission,
): Promise<UserDataProviderPermission> => {
	const result = await db.sql<JsonResultSet<UserDataProviderPermission>>(
		'userDataProviderPermissions.selectByPrimaryKey',
		{
			userKeycloakUserId,
			dataProviderShortCode,
			permission,
		},
	);
	const object = result.rows[0]?.object;
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'UserDataProviderPermission',
			entityPrimaryKey: {
				userKeycloakUserId: keycloakIdToString(userKeycloakUserId),
				dataProviderShortCode,
				permission,
			},
		});
	}
	return object;
};

export { loadUserDataProviderPermission };
