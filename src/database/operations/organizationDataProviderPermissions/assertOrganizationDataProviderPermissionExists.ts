import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import type {
	CheckResult,
	KeycloakId,
	Permission,
	ShortCode,
} from '../../../types';

const assertOrganizationDataProviderPermissionExists = async (
	keycloakOrganizationId: KeycloakId,
	dataProviderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql<CheckResult>(
		'organizationDataProviderPermissions.checkExistsByPrimaryKey',
		{
			keycloakOrganizationId,
			dataProviderShortCode,
			permission,
		},
	);

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'OrganizationDataProviderPermission',
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

export { assertOrganizationDataProviderPermissionExists };
