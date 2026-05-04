import { generateHasPermissionOperation } from '../generators';

const hasApplicationFormFieldPermission = generateHasPermissionOperation(
	'authorization.hasApplicationFormFieldPermission',
	'applicationFormFieldId',
);

export { hasApplicationFormFieldPermission };
