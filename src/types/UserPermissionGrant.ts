import { ajv } from '../ajv';
import type { KeycloakId } from './KeycloakId';
import type { PermissionVerb } from './PermissionVerb';
import type { PermissionEntityType } from './PermissionEntityType';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface UserPermissionGrant {
	readonly id: number;
	readonly userKeycloakUserId: KeycloakId;
	readonly permissionVerb: PermissionVerb;
	readonly rootEntityType: PermissionEntityType;
	readonly rootEntityPk: string;
	entities: string[];
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
	notAfter: string | null | undefined;
}

type WritableUserPermissionGrant = Writable<UserPermissionGrant>;

type InternallyWritableUserPermissionGrant = WritableUserPermissionGrant &
	Pick<
		UserPermissionGrant,
		'userKeycloakUserId' | 'permissionVerb' | 'rootEntityType' | 'rootEntityPk'
	>;

const writableUserPermissionGrantSchema: JSONSchemaType<WritableUserPermissionGrant> =
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

const isWritableUserPermissionGrant = ajv.compile(
	writableUserPermissionGrantSchema,
);

export {
	type InternallyWritableUserPermissionGrant,
	type UserPermissionGrant,
	type WritableUserPermissionGrant,
	isWritableUserPermissionGrant,
};
