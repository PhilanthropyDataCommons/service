import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';

interface CreatedByParameters {
	createdBy: number | undefined;
}

const createdByParametersSchema: JSONSchemaType<CreatedByParameters> = {
	type: 'object',
	properties: {
		createdBy: {
			type: 'integer',
			minimum: 1,
			nullable: true,
		},
	},
	required: [],
};

const isCreatedByParameters = ajv.compile(createdByParametersSchema);

const extractCreatedByParameters = (request: Request): CreatedByParameters => {
	const { query } = request;
	if (!isCreatedByParameters(query)) {
		throw new InputValidationError(
			'Invalid createdBy parameters.',
			isCreatedByParameters.errors ?? [],
		);
	}
	return {
		createdBy: query.createdBy,
	};
};

export { extractCreatedByParameters };
