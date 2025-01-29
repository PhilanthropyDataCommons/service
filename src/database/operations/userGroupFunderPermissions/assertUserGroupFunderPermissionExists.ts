import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	CheckResult,
	KeycloakId,
	Permission,
	ShortCode,
} from '../../../types';

const assertUserGroupFunderPermissionExists = async (
	keycloakOrganizationId: KeycloakId,
	funderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql<CheckResult>(
		'userGroupFunderPermissions.checkExistsByPrimaryKey',
		{
			keycloakOrganizationId,
			funderShortCode,
			permission,
		},
	);

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'UserGroupFunderPermission',
			entityPrimaryKey: {
				keycloakOrganizationId: keycloakIdToString(keycloakOrganizationId),
				funderShortCode,
				permission,
			},
		});
	}
};

export { assertUserGroupFunderPermissionExists };
