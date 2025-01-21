import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	InternallyWritableUserChangemakerPermission,
	UserChangemakerPermission,
} from '../../../types';

const createOrUpdateUserChangemakerPermission =
	generateCreateOrUpdateItemOperation<
		UserChangemakerPermission,
		InternallyWritableUserChangemakerPermission,
		[]
	>(
		'userChangemakerPermissions.insertOrUpdateOne',
		['userKeycloakUserId', 'permission', 'changemakerId', 'createdBy'],
		[],
	);

export { createOrUpdateUserChangemakerPermission };
