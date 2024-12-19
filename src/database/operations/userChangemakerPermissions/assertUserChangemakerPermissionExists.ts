import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakUserIdToString } from '../../../types';
import type {
	CheckResult,
	Id,
	KeycloakUserId,
	Permission,
} from '../../../types';

const assertUserChangemakerPermissionExists = async (
	userKeycloakUserId: KeycloakUserId,
	changemakerId: Id,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql<CheckResult>(
		'userChangemakerPermissions.checkExistsByPrimaryKey',
		{
			userKeycloakUserId,
			changemakerId,
			permission,
		},
	);

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'UserChangemakerPermission',
			entityPrimaryKey: {
				userKeycloakUserId: keycloakUserIdToString(userKeycloakUserId),
				changemakerId,
				permission,
			},
		});
	}
};

export { assertUserChangemakerPermissionExists };
