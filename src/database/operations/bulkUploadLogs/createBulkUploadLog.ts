import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	BulkUploadLog,
	InternallyWritableBulkUploadLog,
} from '../../../types';

const createBulkUploadLog = generateCreateOrUpdateItemOperation<
	BulkUploadLog,
	InternallyWritableBulkUploadLog,
	[]
>('bulkUploadLogs.insertOne', ['bulkUploadTaskId', 'isError', 'details'], []);

export { createBulkUploadLog };
