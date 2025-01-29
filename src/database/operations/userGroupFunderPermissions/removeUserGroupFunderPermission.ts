import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import { db } from '../../db';
import type { KeycloakId, Permission, ShortCode } from '../../../types';

const removeUserGroupFunderPermission = async (
	keycloakOrganizationId: KeycloakId,
	funderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql('userGroupFunderPermissions.deleteOne', {
		keycloakOrganizationId,
		funderShortCode,
		permission,
	});

	if (result.row_count === 0) {
		throw new NotFoundError(
			'The item did not exist and could not be deleted.',
			{
				entityType: 'UserGroupFunderPermission',
				entityPrimaryKey: {
					keycloakOrganizationId: keycloakIdToString(keycloakOrganizationId),
					funderShortCode,
					permission,
				},
			},
		);
	}
};

export { removeUserGroupFunderPermission };
