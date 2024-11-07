import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { KeycloakUserId } from './KeycloakUserId';

interface UserChangemakerPermission {
	readonly userKeycloakUserId: KeycloakUserId;
	readonly permission: Permission;
	readonly changemakerId: number;
	readonly createdBy: KeycloakUserId;
	readonly createdAt: string;
}

type WritableUserChangemakerPermission = Writable<UserChangemakerPermission>;

type InternallyWritableUserChangemakerPermission =
	WritableUserChangemakerPermission &
		Pick<
			UserChangemakerPermission,
			'userKeycloakUserId' | 'permission' | 'changemakerId' | 'createdBy'
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
	InternallyWritableUserChangemakerPermission,
	UserChangemakerPermission,
	WritableUserChangemakerPermission,
	isWritableUserChangemakerPermission,
};
