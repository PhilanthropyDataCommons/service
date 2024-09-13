import { ajv } from '../ajv';
import {
	type WritableBaseFieldWithLocalizationsContext,
	writableBaseFieldWithLocalizationsContextSchema,
} from './BaseField';
import type { JSONSchemaType } from 'ajv';

export interface SyncBaseFieldsJobPayload {
	baseFields: WritableBaseFieldWithLocalizationsContext[];
}

export const syncBaseFieldsJobPayloadSchema: JSONSchemaType<SyncBaseFieldsJobPayload> =
	{
		type: 'object',
		properties: {
			baseFields: {
				type: 'array',
				items: writableBaseFieldWithLocalizationsContextSchema,
			},
		},
		required: ['baseFields'],
	};

export const isSyncBaseFieldsJobPayload = ajv.compile(
	syncBaseFieldsJobPayloadSchema,
);
