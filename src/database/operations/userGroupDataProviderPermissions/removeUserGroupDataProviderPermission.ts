import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import { db } from '../../db';
import type { KeycloakId, Permission, ShortCode } from '../../../types';

const removeUserGroupDataProviderPermission = async (
	keycloakOrganizationId: KeycloakId,
	dataProviderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql('userGroupDataProviderPermissions.deleteOne', {
		keycloakOrganizationId,
		dataProviderShortCode,
		permission,
	});

	if (result.row_count === 0) {
		throw new NotFoundError(
			'The item did not exist and could not be deleted.',
			{
				entityType: 'UserGroupDataProviderPermission',
				entityPrimaryKey: {
					keycloakOrganizationId: keycloakIdToString(keycloakOrganizationId),
					dataProviderShortCode,
					permission,
				},
			},
		);
	}
};

export { removeUserGroupDataProviderPermission };
