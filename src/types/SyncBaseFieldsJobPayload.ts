import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface SyncBaseFieldJobPayload {
	syncBaseFieldId: number;
}

export const syncBaseFieldJobPayloadSchema: JSONSchemaType<SyncBaseFieldJobPayload> =
	{
		type: 'object',
		properties: {
			syncBaseFieldId: {
				type: 'integer',
			},
		},
		required: ['syncBaseFieldId'],
	};

export const isSyncBaseFieldJobPayload = ajv.compile(
	syncBaseFieldJobPayloadSchema,
);
