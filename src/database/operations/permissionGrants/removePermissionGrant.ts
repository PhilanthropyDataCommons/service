import { generateRemoveItemOperation } from '../generators';
import type { Id, PermissionGrant } from '../../../types';

const removePermissionGrant = generateRemoveItemOperation<
	PermissionGrant,
	[permissionGrantId: Id]
>('permissionGrants.deleteOne', 'PermissionGrant', ['permissionGrantId']);

export { removePermissionGrant };
