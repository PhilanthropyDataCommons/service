import { generateLoadBundleOperation } from '../generators';
import type {
	DefaultPermissionGrant,
	PermissionGrantEntityType,
} from '../../../types';

const loadDefaultPermissionGrantBundle = generateLoadBundleOperation<
	DefaultPermissionGrant,
	[contextEntityType: PermissionGrantEntityType | undefined]
>('defaultPermissionGrants.selectWithPagination', ['contextEntityType']);

export { loadDefaultPermissionGrantBundle };
