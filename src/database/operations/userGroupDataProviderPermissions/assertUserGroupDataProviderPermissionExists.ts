import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	CheckResult,
	KeycloakId,
	Permission,
	ShortCode,
} from '../../../types';

const assertUserGroupDataProviderPermissionExists = async (
	keycloakOrganizationId: KeycloakId,
	dataProviderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql<CheckResult>(
		'userGroupDataProviderPermissions.checkExistsByPrimaryKey',
		{
			keycloakOrganizationId,
			dataProviderShortCode,
			permission,
		},
	);

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'UserGroupDataProviderPermission',
			entityPrimaryKey: {
				keycloakorganizationId: keycloakIdToString(
					keycloakOrganizationId,
				),
				dataProviderShortCode,
				permission,
			},
		});
	}
};

export { assertUserGroupDataProviderPermissionExists };
