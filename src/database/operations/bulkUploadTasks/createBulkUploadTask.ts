import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
} from '../../../types';

const createBulkUploadTask = generateCreateOrUpdateItemOperation<
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
	[]
>(
	'bulkUploadTasks.insertOne',
	['sourceId', 'funderShortCode', 'fileName', 'sourceKey', 'status'],
	[],
);

export { createBulkUploadTask };
