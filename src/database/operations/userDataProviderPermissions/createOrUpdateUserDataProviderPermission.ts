import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	UserDataProviderPermission,
	InternallyWritableUserDataProviderPermission,
} from '../../../types';

const createOrUpdateUserDataProviderPermission =
	generateCreateOrUpdateItemOperation<
		UserDataProviderPermission,
		InternallyWritableUserDataProviderPermission
	>('userDataProviderPermissions.insertOrUpdateOne', [
		'userKeycloakUserId',
		'permission',
		'dataProviderShortCode',
		'createdBy',
	]);

export { createOrUpdateUserDataProviderPermission };
