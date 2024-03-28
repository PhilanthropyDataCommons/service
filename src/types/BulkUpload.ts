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
	fileName: string;
	sourceKey: string;
	status: BulkUploadStatus;
	fileSize?: number | null; // see https://github.com/ajv-validator/ajv/issues/2163
	readonly createdAt: Date;
}

export type BulkUploadCreate = Omit<
	BulkUpload,
	'createdAt' | 'status' | 'id' | 'fileSize'
>;

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
	required: ['fileName', 'sourceKey'],
};

export const isBulkUploadCreate = ajv.compile(bulkUploadCreateSchema);
