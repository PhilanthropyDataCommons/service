import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';

interface UserGroupFunderPermission {
	readonly keycloakOrganizationId: KeycloakId;
	readonly permission: Permission;
	readonly funderShortCode: ShortCode;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserGroupFunderPermission =
	Writable<UserGroupFunderPermission>;

type InternallyWritableUserGroupFunderPermission =
	WritableUserGroupFunderPermission &
		Pick<
			UserGroupFunderPermission,
			'keycloakOrganizationId' | 'permission' | 'funderShortCode' | 'createdBy'
		>;

const writableUserGroupFunderPermissionSchema: JSONSchemaType<WritableUserGroupFunderPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableUserGroupFunderPermission = ajv.compile(
	writableUserGroupFunderPermissionSchema,
);

export {
	InternallyWritableUserGroupFunderPermission,
	UserGroupFunderPermission,
	WritableUserGroupFunderPermission,
	isWritableUserGroupFunderPermission,
};
