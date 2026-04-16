import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	BulkUploadTask,
	Id,
	InternallyWritableBulkUploadTask,
} from '../../../types';

const updateBulkUploadTask = generateCreateOrUpdateItemOperation<
	BulkUploadTask,
	Partial<InternallyWritableBulkUploadTask>,
	[bulkUploadTaskId: Id]
>('bulkUploadTasks.updateById', ['status'], ['bulkUploadTaskId']);

export { updateBulkUploadTask };
