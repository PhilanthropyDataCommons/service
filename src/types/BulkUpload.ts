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
		fileSize: {
			type: 'integer',
			nullable: true,
		},
		createdAt: {
			type: 'object',
			required: [],
			instanceof: 'Date',
		},
	},
	required: ['id', 'fileName', 'sourceKey', 'createdAt'],
};

export const isBulkUpload = ajv.compile(bulkUploadSchema);

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
