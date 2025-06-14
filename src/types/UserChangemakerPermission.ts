import { ajv } from '../ajv';
import type { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { KeycloakId } from './KeycloakId';

interface UserChangemakerPermission {
	readonly userKeycloakUserId: KeycloakId;
	readonly permission: Permission;
	readonly changemakerId: number;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserChangemakerPermission = Writable<UserChangemakerPermission>;

type InternallyWritableUserChangemakerPermission =
	WritableUserChangemakerPermission &
		Pick<
			UserChangemakerPermission,
			'userKeycloakUserId' | 'permission' | 'changemakerId'
		>;

const writableUserChangemakerPermissionSchema: JSONSchemaType<WritableUserChangemakerPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableUserChangemakerPermission = ajv.compile(
	writableUserChangemakerPermissionSchema,
);

export {
	type InternallyWritableUserChangemakerPermission,
	type UserChangemakerPermission,
	type WritableUserChangemakerPermission,
	isWritableUserChangemakerPermission,
};
