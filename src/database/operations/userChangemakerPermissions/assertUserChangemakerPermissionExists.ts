import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type { CheckResult, Id, KeycloakId, Permission } from '../../../types';

const assertUserChangemakerPermissionExists = async (
	userKeycloakUserId: KeycloakId,
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
				userKeycloakUserId: keycloakIdToString(userKeycloakUserId),
				changemakerId,
				permission,
			},
		});
	}
};

export { assertUserChangemakerPermissionExists };
