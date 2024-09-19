import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { AuthContext } from '../types';

interface CreatedByQueryParameters {
	createdBy: number | 'me' | undefined;
}

interface CreatedByParameters {
	createdBy: number | undefined;
}

const createdByQueryParametersSchema: JSONSchemaType<CreatedByQueryParameters> =
	{
		anyOf: [
			{
				type: 'object',
				properties: {
					createdBy: {
						type: 'integer',
						minimum: 1,
						nullable: true,
					},
				},
				required: [],
			},
			{
				type: 'object',
				properties: {
					createdBy: {
						type: 'string',
						enum: ['me'],
						nullable: true,
					},
				},
				required: [],
			},
		],
	};

const isCreatedByQueryParameters = ajv.compile(createdByQueryParametersSchema);

const extractCreatedByParameters = (
	request: Pick<Request, 'query'> & Partial<AuthContext>,
): CreatedByParameters => {
	const { query } = request;
	if (!isCreatedByQueryParameters(query)) {
		throw new InputValidationError(
			'Invalid createdBy parameters.',
			isCreatedByQueryParameters.errors ?? [],
		);
	}

	const createdBy =
		query.createdBy === 'me' ? request.user?.id : query.createdBy;

	return {
		createdBy,
	};
};

export { extractCreatedByParameters };
