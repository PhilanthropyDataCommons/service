import { generateHasPermissionOperation } from '../generators';

const hasSourcePermission = generateHasPermissionOperation(
	'authorization.hasSourcePermission',
	'sourceId',
);

export { hasSourcePermission };
