import { generateLoadBundleOperation } from '../generators';
import type { BulkUploadTask, KeycloakId } from '../../../types';

const loadBulkUploadTaskBundle = generateLoadBundleOperation<
	BulkUploadTask,
	[createdBy: KeycloakId | undefined]
>('bulkUploadTasks.selectWithPagination', ['createdBy']);

export { loadBulkUploadTaskBundle };
