import { generateLoadItemOperation } from '../generators';
import type { BulkUploadTask, Id } from '../../../types';

export const loadBulkUploadTask = generateLoadItemOperation<
	BulkUploadTask,
	[bulkUploadTaskId: Id]
>('bulkUploadTasks.selectById', 'BulkUploadTask', ['bulkUploadTaskId']);
