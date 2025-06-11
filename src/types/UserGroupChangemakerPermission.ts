import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { KeycloakId } from './KeycloakId';

interface UserGroupChangemakerPermission {
	readonly keycloakOrganizationId: KeycloakId;
	readonly changemakerId: number;
	readonly permission: Permission;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserGroupChangemakerPermission =
	Writable<UserGroupChangemakerPermission>;

type InternallyWritableUserGroupChangemakerPermission =
	WritableUserGroupChangemakerPermission &
		Pick<
			UserGroupChangemakerPermission,
			'keycloakOrganizationId' | 'changemakerId' | 'permission'
		>;

const writableUserGroupChangemakerPermissionSchema: JSONSchemaType<WritableUserGroupChangemakerPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableUserGroupChangemakerPermission = ajv.compile(
	writableUserGroupChangemakerPermissionSchema,
);

export {
	type InternallyWritableUserGroupChangemakerPermission,
	type UserGroupChangemakerPermission,
	type WritableUserGroupChangemakerPermission,
	isWritableUserGroupChangemakerPermission,
};
