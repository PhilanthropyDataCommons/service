import { ajv } from '../ajv';
import { Permission } from './Permission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { KeycloakId } from './KeycloakId';

interface OrganizationChangemakerPermission {
	readonly keycloakOrganizationId: KeycloakId;
	readonly permission: Permission;
	readonly changemakerId: number;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableOrganizationChangemakerPermission =
	Writable<OrganizationChangemakerPermission>;

type InternallyWritableOrganizationChangemakerPermission =
	WritableOrganizationChangemakerPermission &
		Pick<
			OrganizationChangemakerPermission,
			'keycloakOrganizationId' | 'permission' | 'changemakerId' | 'createdBy'
		>;

const writableOrganizationChangemakerPermissionSchema: JSONSchemaType<WritableOrganizationChangemakerPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableOrganizationChangemakerPermission = ajv.compile(
	writableOrganizationChangemakerPermissionSchema,
);

export {
	InternallyWritableOrganizationChangemakerPermission,
	OrganizationChangemakerPermission,
	WritableOrganizationChangemakerPermission,
	isWritableOrganizationChangemakerPermission,
};
