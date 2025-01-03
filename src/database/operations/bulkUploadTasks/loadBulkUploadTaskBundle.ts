import { generateLoadBundleOperation } from '../generators';
import type { BulkUploadTask, KeycloakId } from '../../../types';

const loadBulkUploadTaskBundle = generateLoadBundleOperation<
	BulkUploadTask,
	[
		authContextKeycloakUserId: KeycloakId | undefined,
		authContextIsAdministrator: boolean | undefined,
		createdBy: KeycloakId | undefined,
	]
>('bulkUploadTasks.selectWithPagination', 'bulk_upload_tasks', [
	'authContextKeycloakUserId',
	'authContextIsAdministrator',
	'createdBy',
]);

export { loadBulkUploadTaskBundle };
