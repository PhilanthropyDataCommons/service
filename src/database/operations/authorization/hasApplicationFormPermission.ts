import { generateHasPermissionOperation } from '../generators';

const hasApplicationFormPermission = generateHasPermissionOperation(
	'authorization.hasApplicationFormPermission',
	'applicationFormId',
);

export { hasApplicationFormPermission };
