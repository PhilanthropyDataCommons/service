import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

enum PermissionVerb {
	VIEW = 'view',
	CREATE = 'create',
	EDIT = 'edit',
	DELETE = 'delete',
	MANAGE = 'manage',
}

const permissionVerbSchema: JSONSchemaType<PermissionVerb> = {
	type: 'string',
	enum: Object.values(PermissionVerb),
};

const isPermissionVerb = ajv.compile(permissionVerbSchema);

export { PermissionVerb, isPermissionVerb, permissionVerbSchema };
