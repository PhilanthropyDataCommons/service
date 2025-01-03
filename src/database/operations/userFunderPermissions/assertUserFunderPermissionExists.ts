import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	CheckResult,
	KeycloakId,
	Permission,
	ShortCode,
} from '../../../types';

const assertUserFunderPermissionExists = async (
	userKeycloakUserId: KeycloakId,
	funderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql<CheckResult>(
		'userFunderPermissions.checkExistsByPrimaryKey',
		{
			userKeycloakUserId,
			funderShortCode,
			permission,
		},
	);

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'UserFunderPermission',
			entityPrimaryKey: {
				userKeycloakUserId: keycloakIdToString(userKeycloakUserId),
				funderShortCode,
				permission,
			},
		});
	}
};

export { assertUserFunderPermissionExists };
