import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	UserFunderPermission,
	InternallyWritableUserFunderPermission,
} from '../../../types';

const createOrUpdateUserFunderPermission = generateCreateOrUpdateItemOperation<
	UserFunderPermission,
	InternallyWritableUserFunderPermission,
	[]
>(
	'userFunderPermissions.insertOrUpdateOne',
	['userKeycloakUserId', 'permission', 'funderShortCode'],
	[],
);

export { createOrUpdateUserFunderPermission };
