import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { permissionGrantGranteeTypeSchema } from '../types';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { PermissionGrantGranteeType } from '../types';

interface GranteeTypeParameters {
	granteeType: PermissionGrantGranteeType | undefined;
}

interface GranteeTypeParametersQuery {
	granteeType: PermissionGrantGranteeType | undefined;
}

const granteeTypeParametersQuerySchema: JSONSchemaType<GranteeTypeParametersQuery> =
	{
		type: 'object',
		properties: {
			granteeType: {
				...permissionGrantGranteeTypeSchema,
				nullable: true,
			},
		},
		required: [],
	};

const isGranteeTypeParametersQuery = ajv.compile(
	granteeTypeParametersQuerySchema,
);

const extractGranteeTypeParameters = (
	request: Request,
): GranteeTypeParameters => {
	const { query } = request;
	if (!isGranteeTypeParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid grantee type parameters.',
			isGranteeTypeParametersQuery.errors ?? [],
		);
	}
	return {
		granteeType: query.granteeType,
	};
};

export { extractGranteeTypeParameters };
