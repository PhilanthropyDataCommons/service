import { generateUpdateItemOperation } from '../generators';
import type {
	BulkUploadTask,
	Id,
	InternallyWritableBulkUploadTask,
} from '../../../types';

const updateBulkUploadTask = generateUpdateItemOperation<
	BulkUploadTask,
	Partial<InternallyWritableBulkUploadTask>,
	[bulkUploadTaskId: Id]
>('bulkUploadTasks.updateById', ['status'], ['bulkUploadTaskId']);

export { updateBulkUploadTask };
