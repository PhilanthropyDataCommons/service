import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakUserId } from './KeycloakUserId';

interface UserFunderPermission {
	readonly userKeycloakUserId: KeycloakUserId;
	readonly permission: Permission;
	readonly funderShortCode: ShortCode;
	readonly createdBy: KeycloakUserId;
	readonly createdAt: string;
}

type WritableUserFunderPermission = Writable<UserFunderPermission>;

type InternallyWritableUserFunderPermission = WritableUserFunderPermission &
	Pick<
		UserFunderPermission,
		'userKeycloakUserId' | 'permission' | 'funderShortCode' | 'createdBy'
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
	InternallyWritableUserFunderPermission,
	UserFunderPermission,
	WritableUserFunderPermission,
	isWritableUserFunderPermission,
};
