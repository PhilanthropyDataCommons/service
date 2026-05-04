import { generateHasPermissionOperation } from '../generators';

const hasBulkUploadPermission = generateHasPermissionOperation(
	'authorization.hasBulkUploadPermission',
	'bulkUploadTaskId',
);

export { hasBulkUploadPermission };
