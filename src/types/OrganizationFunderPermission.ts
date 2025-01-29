import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';
import type { KeycloakId } from './KeycloakId';

interface OrganizationFunderPermission {
	readonly organizationKeycloakId: KeycloakId;
	readonly permission: Permission;
	readonly funderShortCode: ShortCode;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableOrganizationFunderPermission =
	Writable<OrganizationFunderPermission>;

type InternallyWritableOrganizationFunderPermission =
	WritableOrganizationFunderPermission &
		Pick<
			OrganizationFunderPermission,
			'organizationKeycloakId' | 'permission' | 'funderShortCode' | 'createdBy'
		>;

const writableOrganizationFunderPermissionSchema: JSONSchemaType<WritableOrganizationFunderPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableOrganizationFunderPermission = ajv.compile(
	writableOrganizationFunderPermissionSchema,
);

export {
	InternallyWritableOrganizationFunderPermission,
	OrganizationFunderPermission,
	WritableOrganizationFunderPermission,
	isWritableOrganizationFunderPermission,
};
