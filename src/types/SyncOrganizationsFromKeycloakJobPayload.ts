import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';

interface SyncOrganizationsFromKeycloakJobPayload {
	organizationSyncTaskId: Id;
	keycloakAdminAuthorizationHeader: string;
}

const syncOrganizationsFromKeycloakJobPayloadSchema: JSONSchemaType<SyncOrganizationsFromKeycloakJobPayload> =
	{
		type: 'object',
		properties: {
			organizationSyncTaskId: idSchema,
			keycloakAdminAuthorizationHeader: {
				type: 'string',
			},
		},
		required: ['organizationSyncTaskId', 'keycloakAdminAuthorizationHeader'],
	};

const isSyncOrganizationsFromKeycloakJobPayload = ajv.compile(
	syncOrganizationsFromKeycloakJobPayloadSchema,
);

export {
	type SyncOrganizationsFromKeycloakJobPayload,
	syncOrganizationsFromKeycloakJobPayloadSchema,
	isSyncOrganizationsFromKeycloakJobPayload,
};
