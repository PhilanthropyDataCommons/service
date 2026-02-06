import { generateHasPermissionOperation } from '../generators';

const hasDataProviderPermission = generateHasPermissionOperation(
	'authorization.hasDataProviderPermission',
	'dataProviderShortCode',
);

export { hasDataProviderPermission };
