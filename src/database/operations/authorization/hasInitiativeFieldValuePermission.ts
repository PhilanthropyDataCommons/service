import { generateHasPermissionOperation } from '../generators';

const hasInitiativeFieldValuePermission = generateHasPermissionOperation(
	'authorization.hasInitiativeFieldValuePermission',
	'initiativeFieldValueId',
);

export { hasInitiativeFieldValuePermission };
