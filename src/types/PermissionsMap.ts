import type { PermissionGrantEntityType } from './PermissionGrantEntityType';
import type { PermissionGrantVerb } from './PermissionGrantVerb';

type PermissionsMap = Partial<
	Record<PermissionGrantEntityType, PermissionGrantVerb[]>
>;

export { type PermissionsMap };
