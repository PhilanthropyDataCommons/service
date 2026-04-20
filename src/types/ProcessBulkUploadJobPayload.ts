import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';

export interface ProcessBulkUploadJobPayload {
	bulkUploadId: Id;
}

export const processBulkUploadJobPayloadSchema: JSONSchemaType<ProcessBulkUploadJobPayload> =
	{
		type: 'object',
		properties: {
			bulkUploadId: idSchema,
		},
		required: ['bulkUploadId'],
	};

export const isProcessBulkUploadJobPayload = ajv.compile(
	processBulkUploadJobPayloadSchema,
);
