import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { permissionGrantEntityTypeSchema } from '../types';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { PermissionGrantEntityType } from '../types';

interface ScopeParameters {
	scope: PermissionGrantEntityType | undefined;
}

interface ScopeParametersQuery {
	scope: PermissionGrantEntityType | undefined;
}

const scopeParametersQuerySchema: JSONSchemaType<ScopeParametersQuery> = {
	type: 'object',
	properties: {
		scope: {
			...permissionGrantEntityTypeSchema,
			nullable: true,
		},
	},
	required: [],
};

const isScopeParametersQuery = ajv.compile(scopeParametersQuerySchema);

const extractScopeParameters = (request: Request): ScopeParameters => {
	const { query } = request;
	if (!isScopeParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid scope parameters.',
			isScopeParametersQuery.errors ?? [],
		);
	}
	return {
		scope: query.scope,
	};
};

export { extractScopeParameters };
