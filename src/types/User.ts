import { keycloakUserIdSchema } from './KeycloakUserId';
import type { KeycloakUserId } from './KeycloakUserId';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface User {
	keycloakUserId: KeycloakUserId;
	readonly createdAt: string;
}

const userSchema: JSONSchemaType<User> = {
	type: 'object',
	properties: {
		keycloakUserId: keycloakUserIdSchema,
		createdAt: {
			type: 'string',
		},
	},
	required: ['keycloakUserId', 'createdAt'],
};

type WritableUser = Writable<User>;

export { User, userSchema, WritableUser };
