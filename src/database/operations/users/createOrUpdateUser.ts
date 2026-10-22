import { generateUpsertItemOperation } from '../generators';
import type { User, WritableUser } from '../../../types';

const createOrUpdateUser = generateUpsertItemOperation<
	User,
	WritableUser,
	[jwtIssuedAt?: string | null]
>(
	'users.insertOrUpdateOne',
	['keycloakUserId', 'keycloakUserName'],
	['jwtIssuedAt'],
);

export { createOrUpdateUser };
