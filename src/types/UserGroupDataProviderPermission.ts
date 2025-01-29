import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';

interface UserGroupDataProviderPermission {
	readonly keycloakOrganizationId: KeycloakId;
	readonly permission: Permission;
	readonly dataProviderShortCode: ShortCode;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserGroupDataProviderPermission =
	Writable<UserGroupDataProviderPermission>;

type InternallyWritableUserGroupDataProviderPermission =
	WritableUserGroupDataProviderPermission &
		Pick<
			UserGroupDataProviderPermission,
			| 'keycloakOrganizationId'
			| 'permission'
			| 'dataProviderShortCode'
			| 'createdBy'
		>;

const writableUserGroupDataProviderSchema: JSONSchemaType<WritableUserGroupDataProviderPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableUserGroupDataProviderPermission = ajv.compile(
	writableUserGroupDataProviderSchema,
);

export {
	InternallyWritableUserGroupDataProviderPermission,
	UserGroupDataProviderPermission,
	WritableUserGroupDataProviderPermission,
	isWritableUserGroupDataProviderPermission,
};
