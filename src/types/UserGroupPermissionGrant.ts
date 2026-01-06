import { ajv } from '../ajv';
import type { KeycloakId } from './KeycloakId';
import type { PermissionVerb } from './PermissionVerb';
import type { PermissionEntityType } from './PermissionEntityType';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface UserGroupPermissionGrant {
	readonly id: number;
	readonly keycloakOrganizationId: KeycloakId;
	readonly permissionVerb: PermissionVerb;
	readonly rootEntityType: PermissionEntityType;
	readonly rootEntityPk: string;
	entities: string[];
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
	notAfter: string | null | undefined;
}

type WritableUserGroupPermissionGrant = Writable<UserGroupPermissionGrant>;

type InternallyWritableUserGroupPermissionGrant =
	WritableUserGroupPermissionGrant &
		Pick<
			UserGroupPermissionGrant,
			| 'keycloakOrganizationId'
			| 'permissionVerb'
			| 'rootEntityType'
			| 'rootEntityPk'
		>;

const writableUserGroupPermissionGrantSchema: JSONSchemaType<WritableUserGroupPermissionGrant> =
	{
		type: 'object',
		properties: {
			entities: {
				type: 'array',
				items: { type: 'string' },
			},
			notAfter: {
				type: 'string',
				format: 'date-time',
				nullable: true,
			},
		},
		required: ['entities'],
	};

const isWritableUserGroupPermissionGrant = ajv.compile(
	writableUserGroupPermissionGrantSchema,
);

export {
	type InternallyWritableUserGroupPermissionGrant,
	type UserGroupPermissionGrant,
	type WritableUserGroupPermissionGrant,
	isWritableUserGroupPermissionGrant,
};
