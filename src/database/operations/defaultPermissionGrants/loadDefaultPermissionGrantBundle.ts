import { generateLoadBundleOperation } from '../generators';
import type { DefaultPermissionGrant } from '../../../types';

const loadDefaultPermissionGrantBundle = generateLoadBundleOperation<
	DefaultPermissionGrant,
	[]
>('defaultPermissionGrants.selectWithPagination', []);

export { loadDefaultPermissionGrantBundle };
