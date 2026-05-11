import { generateUpsertItemOperation } from '../generators';
import type { User, WritableUser } from '../../../types';

const createOrUpdateUser = generateUpsertItemOperation<User, WritableUser, []>(
	'users.insertOrUpdateOne',
	['keycloakUserId', 'keycloakUserName'],
	[],
);

export { createOrUpdateUser };
