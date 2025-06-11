import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';

interface UserGroupDataProviderPermission {
	readonly keycloakOrganizationId: KeycloakId;
	readonly dataProviderShortCode: ShortCode;
	readonly permission: Permission;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserGroupDataProviderPermission =
	Writable<UserGroupDataProviderPermission>;

type InternallyWritableUserGroupDataProviderPermission =
	WritableUserGroupDataProviderPermission &
		Pick<
			UserGroupDataProviderPermission,
			'keycloakOrganizationId' | 'dataProviderShortCode' | 'permission'
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
	type InternallyWritableUserGroupDataProviderPermission,
	type UserGroupDataProviderPermission,
	type WritableUserGroupDataProviderPermission,
	isWritableUserGroupDataProviderPermission,
};
