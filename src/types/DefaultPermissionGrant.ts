import { validateWritablePermissionGrantFields } from './PermissionGrant';
import type { TypeGuardWithAjvErrors } from '../ajv';
import type {
	PermissionGrantGrantee,
	UnkeyedPermissionGrant,
} from './PermissionGrant';
import type { Writable } from './Writable';

/**
 * A permission grant template: everything a `PermissionGrant` carries except
 * the key naming its context entity. A default permission grant combined with
 * a newly created entity of its `contextEntityType` describes a permission
 * grant.
 */
type DefaultPermissionGrant = UnkeyedPermissionGrant & PermissionGrantGrantee;

type WritableDefaultPermissionGrant = Writable<DefaultPermissionGrant>;

const isWritableDefaultPermissionGrant: TypeGuardWithAjvErrors<
	WritableDefaultPermissionGrant
> = (data: unknown): data is WritableDefaultPermissionGrant => {
	const errors = validateWritablePermissionGrantFields(data, {
		includeContextEntityKey: false,
	});
	isWritableDefaultPermissionGrant.errors = errors;
	return errors === null;
};

export {
	isWritableDefaultPermissionGrant,
	type DefaultPermissionGrant,
	type WritableDefaultPermissionGrant,
};
