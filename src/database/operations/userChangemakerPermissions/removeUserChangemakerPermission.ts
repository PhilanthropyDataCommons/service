import { NotFoundError } from '../../../errors';
import { keycloakUserIdToString } from '../../../types';
import { db } from '../../db';
import type { KeycloakUserId, Permission } from '../../../types';

const removeUserChangemakerPermission = async (
	userKeycloakUserId: KeycloakUserId,
	changemakerId: number,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql('userChangemakerPermissions.deleteOne', {
		userKeycloakUserId,
		permission,
		changemakerId,
	});

	if (result.row_count === 0) {
		throw new NotFoundError(
			'The item did not exist and could not be deleted.',
			{
				entityType: 'UserChangemakerPermission',
				entityPrimaryKey: {
					userKeycloakUserId: keycloakUserIdToString(userKeycloakUserId),
					permission,
					changemakerId,
				},
			},
		);
	}
};

export { removeUserChangemakerPermission };
