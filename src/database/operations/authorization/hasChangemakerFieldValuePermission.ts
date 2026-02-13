import { generateHasPermissionOperation } from '../generators';

const hasChangemakerFieldValuePermission = generateHasPermissionOperation(
	'authorization.hasChangemakerFieldValuePermission',
	'changemakerFieldValueId',
);

export { hasChangemakerFieldValuePermission };
