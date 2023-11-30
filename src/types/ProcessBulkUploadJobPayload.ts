import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface ProcessBulkUploadJobPayload {
  bulkUploadId: number;
}

export const processBulkUploadJobPayloadSchema: JSONSchemaType<ProcessBulkUploadJobPayload> = {
  type: 'object',
  properties: {
    bulkUploadId: {
      type: 'integer',
    },
  },
  required: [
    'bulkUploadId',
  ],
};

export const isProcessBulkUploadJobPayload = ajv.compile(processBulkUploadJobPayloadSchema);
