import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { permissionGrantVerbSchema } from '../types';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { PermissionGrantVerb } from '../types';

interface VerbParameters {
	verb: PermissionGrantVerb | undefined;
}

interface VerbParametersQuery {
	verb: PermissionGrantVerb | undefined;
}

const verbParametersQuerySchema: JSONSchemaType<VerbParametersQuery> = {
	type: 'object',
	properties: {
		verb: {
			...permissionGrantVerbSchema,
			nullable: true,
		},
	},
	required: [],
};

const isVerbParametersQuery = ajv.compile(verbParametersQuerySchema);

const extractVerbParameters = (request: Request): VerbParameters => {
	const { query } = request;
	if (!isVerbParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid verb parameters.',
			isVerbParametersQuery.errors ?? [],
		);
	}
	return {
		verb: query.verb,
	};
};

export { extractVerbParameters };
