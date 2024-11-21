import { keycloakUserIdSchema } from './KeycloakUserId';
import { permissionSchema } from './Permission';
import type { KeycloakUserId } from './KeycloakUserId';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { Permission } from './Permission';

interface User {
	keycloakUserId: KeycloakUserId;
	readonly permissions: {
		changemaker: Record<string, Permission[]>;
		dataProvider: Record<string, Permission[]>;
		funder: Record<string, Permission[]>;
	};
	readonly createdAt: string;
}

const userSchema: JSONSchemaType<User> = {
	type: 'object',
	properties: {
		keycloakUserId: keycloakUserIdSchema,
		permissions: {
			type: 'object',
			properties: {
				changemaker: {
					type: 'object',
					additionalProperties: {
						type: 'array',
						items: permissionSchema,
					},
					required: [],
				},
				dataProvider: {
					type: 'object',
					additionalProperties: {
						type: 'array',
						items: permissionSchema,
					},
					required: [],
				},
				funder: {
					type: 'object',
					additionalProperties: {
						type: 'array',
						items: permissionSchema,
					},
					required: [],
				},
			},
			required: ['changemaker', 'dataProvider', 'funder'],
		},
		createdAt: {
			type: 'string',
		},
	},
	required: ['keycloakUserId', 'permissions', 'createdAt'],
};

type WritableUser = Writable<User>;

export { User, userSchema, WritableUser };
