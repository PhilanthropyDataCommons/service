import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { Source } from './Source';
import type { KeycloakUserId } from './KeycloakUserId';

enum BulkUploadStatus {
	PENDING = 'pending',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELED = 'canceled',
}

interface BulkUpload {
	readonly id: number;
	sourceId: number;
	readonly source: Source;
	fileName: string;
	sourceKey: string;
	readonly status: BulkUploadStatus;
	readonly fileSize?: number | null; // see https://github.com/ajv-validator/ajv/issues/2163
	readonly createdAt: string;
	readonly createdBy: KeycloakUserId;
}

type WritableBulkUpload = Writable<BulkUpload>;

type InternallyWritableBulkUpload = WritableBulkUpload &
	Pick<BulkUpload, 'status' | 'fileSize' | 'createdBy'>;

const writableBulkUploadSchema: JSONSchemaType<WritableBulkUpload> = {
	type: 'object',
	properties: {
		sourceId: {
			type: 'integer',
		},
		fileName: {
			type: 'string',
			pattern: '^.+\\.csv$',
		},
		sourceKey: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['sourceId', 'fileName', 'sourceKey'],
};

const isWritableBulkUpload = ajv.compile(writableBulkUploadSchema);

export {
	BulkUpload,
	BulkUploadStatus,
	InternallyWritableBulkUpload,
	WritableBulkUpload,
	isWritableBulkUpload,
	writableBulkUploadSchema,
};
