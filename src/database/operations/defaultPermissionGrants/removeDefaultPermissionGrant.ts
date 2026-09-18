import { generateRemoveItemOperation } from '../generators';
import type { DefaultPermissionGrant, Id } from '../../../types';

const removeDefaultPermissionGrant = generateRemoveItemOperation<
	DefaultPermissionGrant,
	[defaultPermissionGrantId: Id]
>('defaultPermissionGrants.deleteOne', 'DefaultPermissionGrant', [
	'defaultPermissionGrantId',
]);

export { removeDefaultPermissionGrant };
