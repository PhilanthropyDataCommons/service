import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export enum BulkUploadStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export interface BulkUpload {
  readonly id: number;
  fileName: string
  sourceKey: string;
  status: BulkUploadStatus;
  readonly createdAt: Date;
}

export const bulkUploadSchema: JSONSchemaType<BulkUpload> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    fileName: {
      type: 'string',
    },
    sourceKey: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    createdAt: {
      type: 'object',
      required: [],
      instanceof: 'Date',
    },
  },
  required: [
    'id',
    'fileName',
    'sourceKey',
    'createdAt',
  ],
};

export const isBulkUpload = ajv.compile(bulkUploadSchema);

// See https://github.com/typescript-eslint/typescript-eslint/issues/1824
/* eslint-disable @typescript-eslint/indent */
export type BulkUploadCreate = Omit<BulkUpload, 'createdAt' | 'status' | 'id'>;
/* eslint-enable @typescript-eslint/indent */

export const bulkUploadCreateSchema: JSONSchemaType<BulkUploadCreate> = {
  type: 'object',
  properties: {
    fileName: {
      type: 'string',
      pattern: '^.+\\.csv$',
    },
    sourceKey: {
      type: 'string',
      minLength: 1,
    },
  },
  required: [
    'fileName',
    'sourceKey',
  ],
};

export const isBulkUploadCreate = ajv.compile(bulkUploadCreateSchema);
