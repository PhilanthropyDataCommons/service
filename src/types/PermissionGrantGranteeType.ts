import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

enum PermissionGrantGranteeType {
	USER = 'user',
	USER_GROUP = 'userGroup',
}

const permissionGrantGranteeTypeSchema: JSONSchemaType<PermissionGrantGranteeType> =
	{
		type: 'string',
		enum: Object.values(PermissionGrantGranteeType),
	};

const isPermissionGrantGranteeType = ajv.compile(
	permissionGrantGranteeTypeSchema,
);

export {
	isPermissionGrantGranteeType,
	PermissionGrantGranteeType,
	permissionGrantGranteeTypeSchema,
};
