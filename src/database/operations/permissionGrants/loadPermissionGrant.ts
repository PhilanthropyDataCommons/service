import { generateLoadItemOperation } from '../generators';
import type { Id, PermissionGrant } from '../../../types';

const loadPermissionGrant = generateLoadItemOperation<
	PermissionGrant,
	[permissionGrantId: Id]
>('permissionGrants.selectById', 'PermissionGrant', ['permissionGrantId']);

export { loadPermissionGrant };
