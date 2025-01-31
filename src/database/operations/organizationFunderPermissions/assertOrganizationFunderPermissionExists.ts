import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	CheckResult,
	KeycloakId,
	Permission,
	ShortCode,
} from '../../../types';

const assertOrganizationFunderPermissionExists = async (
	keycloakOrganizationId: KeycloakId,
	funderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql<CheckResult>(
		'organizationFunderPermissions.checkExistsByPrimaryKey',
		{
			keycloakOrganizationId,
			funderShortCode,
			permission,
		},
	);

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'OrganizationFunderPermission',
			entityPrimaryKey: {
				keycloakOrganizationId: keycloakIdToString(keycloakOrganizationId),
				funderShortCode,
				permission,
			},
		});
	}
};

export { assertOrganizationFunderPermissionExists };
