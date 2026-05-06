import { v4 as uuidv4 } from 'uuid';
import { createOrUpdateUser } from '../../database';
import { stringToKeycloakId } from '../../types';
import type { TinyPg } from 'tinypg';
import type { AuthContext, User, WritableUser } from '../../types';

const createTestUser = async (
	db: Pick<TinyPg, 'sql'>,
	authContext: AuthContext | null,
	overrideValues?: Partial<WritableUser>,
): Promise<User> => {
	const id = uuidv4();
	const defaultValues: WritableUser = {
		keycloakUserId: stringToKeycloakId(id),
		keycloakUserName: `Test User ${id}`,
	};
	const { item } = await createOrUpdateUser(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
	return item;
};

export { createTestUser };
