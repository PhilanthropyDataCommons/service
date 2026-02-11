import { generateHasPermissionOperation } from '../generators';

const hasFunderPermission = generateHasPermissionOperation(
	'authorization.hasFunderPermission',
	'funderShortCode',
);

export { hasFunderPermission };
