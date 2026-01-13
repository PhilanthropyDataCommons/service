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
	[
		'sourceId',
		'applicationFormId',
		'funderShortCode',
		'proposalsDataFileId',
		'attachmentsArchiveFileId',
		'status',
	],
	[],
);

export { createBulkUploadTask };
