import { db } from '../../db';
import type {
	UserDataProviderPermission,
	InternallyWritableUserDataProviderPermission,
	JsonResultSet,
} from '../../../types';

const createOrUpdateUserDataProviderPermission = async (
	createValues: InternallyWritableUserDataProviderPermission,
): Promise<UserDataProviderPermission> => {
	const { userKeycloakUserId, dataProviderShortCode, permission, createdBy } =
		createValues;
	const result = await db.sql<JsonResultSet<UserDataProviderPermission>>(
		'userDataProviderPermissions.insertOrUpdateOne',
		{
			userKeycloakUserId,
			permission,
			dataProviderShortCode,
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

export { createOrUpdateUserDataProviderPermission };
