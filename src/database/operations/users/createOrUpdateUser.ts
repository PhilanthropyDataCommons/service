import { generateCreateOrUpdateItemOperation } from '../generators';
import type { User, WritableUser } from '../../../types';

const createOrUpdateUser = generateCreateOrUpdateItemOperation<
	User,
	WritableUser,
	[]
>('users.insertOrUpdateOne', ['keycloakUserId', 'keycloakUserName'], []);

export { createOrUpdateUser };
