import { db } from '../../db';
import type {
	UserFunderPermission,
	InternallyWritableUserFunderPermission,
	JsonResultSet,
} from '../../../types';

const createOrUpdateUserFunderPermission = async (
	createValues: InternallyWritableUserFunderPermission,
): Promise<UserFunderPermission> => {
	const { userKeycloakUserId, funderShortCode, permission, createdBy } =
		createValues;
	const result = await db.sql<JsonResultSet<UserFunderPermission>>(
		'userFunderPermissions.insertOrUpdateOne',
		{
			userKeycloakUserId,
			permission,
			funderShortCode,
			createdBy,
		},
	);

	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};

export { createOrUpdateUserFunderPermission };
