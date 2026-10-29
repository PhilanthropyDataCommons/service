import { generateUpsertItemOperation } from '../generators';
import type { User, WritableUser } from '../../../types';

const createOrUpdateUser = generateUpsertItemOperation<
	User,
	WritableUser,
	[knownLiveAt?: string | null, syncedFromKeycloakAt?: string | null]
>(
	'users.insertOrUpdateOne',
	['keycloakUserId', 'keycloakUserName'],
	['knownLiveAt', 'syncedFromKeycloakAt'],
);

export { createOrUpdateUser };
