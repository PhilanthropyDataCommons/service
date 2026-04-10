import { generateLoadBundleOperation } from '../generators';
import type { PermissionGrant } from '../../../types';

const loadPermissionGrantBundle = generateLoadBundleOperation<
	PermissionGrant,
	[]
>('permissionGrants.selectWithPagination', []);

export { loadPermissionGrantBundle };
