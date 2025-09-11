import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
} from '../../../types';

const updateBulkUploadTask = generateCreateOrUpdateItemOperation<
	BulkUploadTask,
	Partial<InternallyWritableBulkUploadTask>,
	[bulkUploadTaskId: number]
>('bulkUploadTasks.updateById', ['status'], ['bulkUploadTaskId']);

export { updateBulkUploadTask };
