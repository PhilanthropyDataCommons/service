import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	CheckResult,
	KeycloakId,
	Permission,
	ShortCode,
} from '../../../types';

const assertUserDataProviderPermissionExists = async (
	userKeycloakUserId: KeycloakId,
	dataProviderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql<CheckResult>(
		'userDataProviderPermissions.checkExistsByPrimaryKey',
		{
			userKeycloakUserId,
			dataProviderShortCode,
			permission,
		},
	);

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'UserDataProviderPermission',
			entityPrimaryKey: {
				userKeycloakUserId: keycloakIdToString(userKeycloakUserId),
				dataProviderShortCode,
				permission,
			},
		});
	}
};

export { assertUserDataProviderPermissionExists };
