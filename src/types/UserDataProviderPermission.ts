import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakUserId } from './KeycloakUserId';

interface UserDataProviderPermission {
	readonly userKeycloakUserId: KeycloakUserId;
	readonly permission: Permission;
	readonly dataProviderShortCode: ShortCode;
	readonly createdBy: KeycloakUserId;
	readonly createdAt: string;
}

type WritableUserDataProviderPermission = Writable<UserDataProviderPermission>;

type InternallyWritableUserDataProviderPermission =
	WritableUserDataProviderPermission &
		Pick<
			UserDataProviderPermission,
			| 'userKeycloakUserId'
			| 'permission'
			| 'dataProviderShortCode'
			| 'createdBy'
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
	InternallyWritableUserDataProviderPermission,
	UserDataProviderPermission,
	WritableUserDataProviderPermission,
	isWritableUserDataProviderPermission,
};
