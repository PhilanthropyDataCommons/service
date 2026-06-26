import { generateHasPermissionOperation } from '../generators';

const hasTerminologySetPermission = generateHasPermissionOperation(
	'authorization.hasTerminologySetPermission',
	'terminologySetId',
);

export { hasTerminologySetPermission };
