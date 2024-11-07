import { db } from '../../db';
import type {
	InternallyWritableUserChangemakerPermission,
	JsonResultSet,
	UserChangemakerPermission,
} from '../../../types';

const createOrUpdateUserChangemakerPermission = async (
	createValues: InternallyWritableUserChangemakerPermission,
): Promise<UserChangemakerPermission> => {
	const { userKeycloakUserId, changemakerId, permission, createdBy } =
		createValues;
	const result = await db.sql<JsonResultSet<UserChangemakerPermission>>(
		'userChangemakerPermissions.insertOrUpdateOne',
		{
			userKeycloakUserId,
			permission,
			changemakerId,
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

export { createOrUpdateUserChangemakerPermission };
