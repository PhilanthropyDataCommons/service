import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import { db } from '../../db';
import type { KeycloakId, Permission } from '../../../types';

const removeOrganizationChangemakerPermission = async (
	keycloakOrganizationId: KeycloakId,
	changemakerId: number,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql('organizationChangemakerPermissions.deleteOne', {
		keycloakOrganizationId,
		permission,
		changemakerId,
	});

	if (result.row_count === 0) {
		throw new NotFoundError(
			'The item did not exist and could not be deleted.',
			{
				entityType: 'OrganizationChangemakerPermission',
				entityPrimaryKey: {
					keycloakOrganizationId: keycloakIdToString(keycloakOrganizationId),
					permission,
					changemakerId,
				},
			},
		);
	}
};

export { removeOrganizationChangemakerPermission };
