import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';

interface OrganizationDataProviderPermission {
	readonly keycloakOrganizationId: KeycloakId;
	readonly permission: Permission;
	readonly dataProviderShortCode: ShortCode;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableOrganizationDataProviderPermission =
	Writable<OrganizationDataProviderPermission>;

type InternallyWritableOrganizationDataProviderPermission =
	WritableOrganizationDataProviderPermission &
		Pick<
			OrganizationDataProviderPermission,
			| 'keycloakOrganizationId'
			| 'permission'
			| 'dataProviderShortCode'
			| 'createdBy'
		>;

const writableOrganizationDataProviderSchema: JSONSchemaType<WritableOrganizationDataProviderPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableOrganizationDataProviderPermission = ajv.compile(
	writableOrganizationDataProviderSchema,
);

export {
	InternallyWritableOrganizationDataProviderPermission,
	OrganizationDataProviderPermission,
	WritableOrganizationDataProviderPermission,
	isWritableOrganizationDataProviderPermission,
};
