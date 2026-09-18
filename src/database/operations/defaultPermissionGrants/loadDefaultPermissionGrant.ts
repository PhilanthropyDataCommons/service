import { generateLoadItemOperation } from '../generators';
import type { DefaultPermissionGrant, Id } from '../../../types';

const loadDefaultPermissionGrant = generateLoadItemOperation<
	DefaultPermissionGrant,
	[defaultPermissionGrantId: Id]
>('defaultPermissionGrants.selectById', 'DefaultPermissionGrant', [
	'defaultPermissionGrantId',
]);

export { loadDefaultPermissionGrant };
