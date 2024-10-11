import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { keycloakUserIdSchema } from '../types';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { KeycloakUserId, AuthContext } from '../types';

interface CreatedByQueryParameters {
	createdBy: KeycloakUserId | 'me' | undefined;
}

interface CreatedByParameters {
	createdBy: KeycloakUserId | undefined;
}

const createdByQueryParametersSchema: JSONSchemaType<CreatedByQueryParameters> =
	{
		anyOf: [
			{
				type: 'object',
				properties: {
					createdBy: {
						...keycloakUserIdSchema,
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
		query.createdBy === 'me' ? request.user?.keycloakUserId : query.createdBy;

	return {
		createdBy,
	};
};

export { extractCreatedByParameters };
