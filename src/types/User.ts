import { keycloakIdSchema } from './KeycloakId';
import type { KeycloakId } from './KeycloakId';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface User {
	keycloakUserId: KeycloakId;
	// We do not really want "undefined" here, only null. See
	// https://github.com/ajv-validator/ajv/issues/2283 and/or
	// https://github.com/ajv-validator/ajv/issues/2163.
	keycloakUserName: string | null | undefined;
	readonly createdAt: string;
}

const userSchema: JSONSchemaType<User> = {
	type: 'object',
	properties: {
		keycloakUserId: keycloakIdSchema,
		keycloakUserName: {
			type: 'string',
			nullable: true,
		},
		createdAt: {
			type: 'string',
		},
	},
	required: ['keycloakUserId', 'createdAt'],
};

type WritableUser = Writable<User>;

export { type User, userSchema, type WritableUser };
