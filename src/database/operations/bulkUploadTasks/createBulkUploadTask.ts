import { generateCreateItemOperation } from '../generators';
import type {
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
} from '../../../types';

const createBulkUploadTask = generateCreateItemOperation<
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
	[]
>(
	'bulkUploadTasks.insertOne',
	[
		'sourceId',
		'applicationFormId',
		'proposalsDataFileId',
		'attachmentsArchiveFileId',
		'status',
	],
	[],
);

export { createBulkUploadTask };
