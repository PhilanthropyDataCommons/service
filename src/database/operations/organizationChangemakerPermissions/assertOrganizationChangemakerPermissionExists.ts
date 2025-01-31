import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type { CheckResult, Id, KeycloakId, Permission } from '../../../types';

const assertOrganizationChangemakerPermissionExists = async (
	keycloakOrganizationId: KeycloakId,
	changemakerId: Id,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql<CheckResult>(
		'organizationChangemakerPermissions.checkExistsByPrimaryKey',
		{
			keycloakOrganizationId,
			changemakerId,
			permission,
		},
	);

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'OrganizationChangemakerPermission',
			entityPrimaryKey: {
				keycloakOrganizationId: keycloakIdToString(keycloakOrganizationId),
				changemakerId,
				permission,
			},
		});
	}
};

export { assertOrganizationChangemakerPermissionExists };
