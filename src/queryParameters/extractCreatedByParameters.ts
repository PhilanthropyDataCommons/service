import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { keycloakIdSchema } from '../types';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { KeycloakId, AuthContext } from '../types';

interface CreatedByQueryParameters {
	createdBy: KeycloakId | 'me' | undefined;
}

interface CreatedByParameters {
	createdBy: KeycloakId | undefined;
}

const createdByQueryParametersSchema: JSONSchemaType<CreatedByQueryParameters> =
	{
		anyOf: [
			{
				type: 'object',
				properties: {
					createdBy: {
						...keycloakIdSchema,
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
	const coercedQuery = coerceQuery(query);
	if (!isCreatedByQueryParameters(coercedQuery)) {
		throw new InputValidationError(
			'Invalid createdBy parameters.',
			isCreatedByQueryParameters.errors ?? [],
		);
	}

	const createdBy =
		coercedQuery.createdBy === 'me'
			? request.user?.keycloakUserId
			: coercedQuery.createdBy;

	return {
		createdBy,
	};
};

export { extractCreatedByParameters };
