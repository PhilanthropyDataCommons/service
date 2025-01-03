import { NotFoundError } from '../../../errors';
import { keycloakIdToString } from '../../../types';
import { db } from '../../db';
import type { KeycloakId, Permission, ShortCode } from '../../../types';

const removeUserFunderPermission = async (
	userKeycloakUserId: KeycloakId,
	funderShortCode: ShortCode,
	permission: Permission,
): Promise<void> => {
	const result = await db.sql('userFunderPermissions.deleteOne', {
		userKeycloakUserId,
		funderShortCode,
		permission,
	});

	if (result.row_count === 0) {
		throw new NotFoundError(
			'The item did not exist and could not be deleted.',
			{
				entityType: 'UserFunderPermission',
				entityPrimaryKey: {
					userKeycloakUserId: keycloakIdToString(userKeycloakUserId),
					funderShortCode,
					permission,
				},
			},
		);
	}
};

export { removeUserFunderPermission };
