import { generateCreateItemOperation } from '../generators';
import type {
	BulkUploadLog,
	InternallyWritableBulkUploadLog,
} from '../../../types';

const createBulkUploadLog = generateCreateItemOperation<
	BulkUploadLog,
	InternallyWritableBulkUploadLog,
	[]
>('bulkUploadLogs.insertOne', ['bulkUploadTaskId', 'isError', 'details'], []);

export { createBulkUploadLog };
