import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';

interface UserFunderPermission {
	readonly userKeycloakUserId: KeycloakId;
	readonly permission: Permission;
	readonly funderShortCode: ShortCode;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserFunderPermission = Writable<UserFunderPermission>;

type InternallyWritableUserFunderPermission = WritableUserFunderPermission &
	Pick<
		UserFunderPermission,
		'userKeycloakUserId' | 'permission' | 'funderShortCode'
	>;

const writableUserFunderPermissionSchema: JSONSchemaType<WritableUserFunderPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableUserFunderPermission = ajv.compile(
	writableUserFunderPermissionSchema,
);

export {
	type InternallyWritableUserFunderPermission,
	type UserFunderPermission,
	type WritableUserFunderPermission,
	isWritableUserFunderPermission,
};
