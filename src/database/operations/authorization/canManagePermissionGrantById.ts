import { generateExistsOperation } from '../generators';
import type { Id } from '../../../types';

const canManagePermissionGrantById = generateExistsOperation<{
	permissionGrantId: Id;
}>('authorization.canManagePermissionGrantById', ['permissionGrantId']);

export { canManagePermissionGrantById };
