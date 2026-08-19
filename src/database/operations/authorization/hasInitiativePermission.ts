import { generateHasPermissionOperation } from '../generators';

const hasInitiativePermission = generateHasPermissionOperation(
	'authorization.hasInitiativePermission',
	'initiativeId',
);

export { hasInitiativePermission };
