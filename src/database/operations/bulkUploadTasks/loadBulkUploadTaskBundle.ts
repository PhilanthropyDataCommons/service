import { generateLoadBundleOperation } from '../generators';
import type { BulkUploadTask, KeycloakId } from '../../../types';

const loadBulkUploadTaskBundle = generateLoadBundleOperation<
	BulkUploadTask,
	[createdBy: KeycloakId | undefined]
>('bulkUploadTasks.selectWithPagination', 'bulk_upload_tasks', ['createdBy']);

export { loadBulkUploadTaskBundle };
