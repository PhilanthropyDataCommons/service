import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

enum PermissionGrantVerb {
	VIEW = 'view',
	CREATE = 'create',
	EDIT = 'edit',
	DELETE = 'delete',
	MANAGE = 'manage',
}

const permissionGrantVerbSchema: JSONSchemaType<PermissionGrantVerb> = {
	type: 'string',
	enum: Object.values(PermissionGrantVerb),
};

const isPermissionGrantVerb = ajv.compile(permissionGrantVerbSchema);

export {
	PermissionGrantVerb,
	permissionGrantVerbSchema,
	isPermissionGrantVerb,
};
