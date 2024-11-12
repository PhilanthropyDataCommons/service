import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

enum Permission {
	MANAGE = 'manage',
	EDIT = 'edit',
	VIEW = 'view',
}

const permissionSchema: JSONSchemaType<Permission> = {
	type: 'string',
	enum: Object.values(Permission),
};

const isPermission = ajv.compile(permissionSchema);

export { Permission, permissionSchema, isPermission };
