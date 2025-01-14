import { generateCreateOrUpdateItemOperation } from '../generators';
import type { User, WritableUser } from '../../../types';

const createUser = generateCreateOrUpdateItemOperation<User, WritableUser>(
	'users.insertOne',
	['keycloakUserId'],
);

export { createUser };
