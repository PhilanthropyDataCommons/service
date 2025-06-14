import { ajv } from '../ajv';
import type { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';

interface UserDataProviderPermission {
	readonly userKeycloakUserId: KeycloakId;
	readonly permission: Permission;
	readonly dataProviderShortCode: ShortCode;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserDataProviderPermission = Writable<UserDataProviderPermission>;

type InternallyWritableUserDataProviderPermission =
	WritableUserDataProviderPermission &
		Pick<
			UserDataProviderPermission,
			'userKeycloakUserId' | 'permission' | 'dataProviderShortCode'
		>;

const writableUserDataProviderSchema: JSONSchemaType<WritableUserDataProviderPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableUserDataProviderPermission = ajv.compile(
	writableUserDataProviderSchema,
);

export {
	type InternallyWritableUserDataProviderPermission,
	type UserDataProviderPermission,
	type WritableUserDataProviderPermission,
	isWritableUserDataProviderPermission,
};
