import { keycloakIdSchema } from './KeycloakId';
import { permissionSchema } from './Permission';
import { opportunityPermissionSchema } from './OpportunityPermission';
import type { KeycloakId } from './KeycloakId';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { Permission } from './Permission';
import type { OpportunityPermission } from './OpportunityPermission';

interface User {
	keycloakUserId: KeycloakId;
	// We do not really want "undefined" here, only null. See
	// https://github.com/ajv-validator/ajv/issues/2283 and/or
	// https://github.com/ajv-validator/ajv/issues/2163.
	keycloakUserName: string | null | undefined;
	readonly permissions: {
		changemaker: Record<string, Permission[]>;
		dataProvider: Record<string, Permission[]>;
		funder: Record<string, Permission[]>;
		opportunity: Record<string, OpportunityPermission[]>;
	};
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
				opportunity: {
					type: 'object',
					additionalProperties: {
						type: 'array',
						items: opportunityPermissionSchema,
					},
					required: [],
				},
			},
			required: ['changemaker', 'dataProvider', 'funder', 'opportunity'],
		},
		createdAt: {
			type: 'string',
		},
	},
	required: ['keycloakUserId', 'createdAt'],
};

type WritableUser = Writable<User>;

export { type User, userSchema, type WritableUser };
