import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';

interface SyncUsersFromKeycloakJobPayload {
	userSyncTaskId: Id;
	keycloakAdminAuthorizationHeader: string;
}

const syncUsersFromKeycloakJobPayloadSchema: JSONSchemaType<SyncUsersFromKeycloakJobPayload> =
	{
		type: 'object',
		properties: {
			userSyncTaskId: idSchema,
			keycloakAdminAuthorizationHeader: {
				type: 'string',
			},
		},
		required: ['userSyncTaskId', 'keycloakAdminAuthorizationHeader'],
	};

const isSyncUsersFromKeycloakJobPayload = ajv.compile(
	syncUsersFromKeycloakJobPayloadSchema,
);

export {
	type SyncUsersFromKeycloakJobPayload,
	syncUsersFromKeycloakJobPayloadSchema,
	isSyncUsersFromKeycloakJobPayload,
};
