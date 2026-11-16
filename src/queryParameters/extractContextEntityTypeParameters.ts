import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { permissionGrantEntityTypeSchema } from '../types';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { PermissionGrantEntityType } from '../types';

interface ContextEntityTypeParameters {
	contextEntityType: PermissionGrantEntityType | undefined;
}

interface ContextEntityTypeParametersQuery {
	contextEntityType: PermissionGrantEntityType | undefined;
}

const contextEntityTypeParametersQuerySchema: JSONSchemaType<ContextEntityTypeParametersQuery> =
	{
		type: 'object',
		properties: {
			contextEntityType: {
				...permissionGrantEntityTypeSchema,
				nullable: true,
			},
		},
		required: [],
	};

const isContextEntityTypeParametersQuery = ajv.compile(
	contextEntityTypeParametersQuerySchema,
);

const extractContextEntityTypeParameters = (
	request: Request,
): ContextEntityTypeParameters => {
	const { query } = request;
	if (!isContextEntityTypeParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid context entity type parameters.',
			isContextEntityTypeParametersQuery.errors ?? [],
		);
	}
	return {
		contextEntityType: query.contextEntityType,
	};
};

export { extractContextEntityTypeParameters };
