import { generateHasPermissionOperation } from '../generators';

const hasChangemakerPermission = generateHasPermissionOperation(
	'authorization.hasChangemakerPermission',
	'changemakerId',
);

export { hasChangemakerPermission };
