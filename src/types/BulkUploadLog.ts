import type { Id } from './Id';
import type { Writable } from './Writable';

export interface BulkUploadLogDetails {
	readonly message: string;
	readonly name?: string;
	readonly cause?: BulkUploadLogDetails;
}

export interface BulkUploadLog {
	readonly bulkUploadTaskId: Id;
	readonly createdAt: string;
	readonly isError: boolean;
	readonly details: BulkUploadLogDetails;
}

export type WritableBulkUploadLog = Writable<BulkUploadLog>;

export type InternallyWritableBulkUploadLog = WritableBulkUploadLog &
	Pick<BulkUploadLog, 'bulkUploadTaskId' | 'isError' | 'details'>;
