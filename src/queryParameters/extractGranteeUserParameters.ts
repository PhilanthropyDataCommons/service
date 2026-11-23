import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { keycloakIdSchema } from '../types';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { AuthContext, KeycloakId } from '../types';

interface GranteeUserQueryParameters {
	granteeUser: KeycloakId | 'me' | undefined;
}

interface GranteeUserParameters {
	granteeUserKeycloakUserId: KeycloakId | undefined;
}

const granteeUserQueryParametersSchema: JSONSchemaType<GranteeUserQueryParameters> =
	{
		anyOf: [
			{
				type: 'object',
				properties: {
					granteeUser: {
						...keycloakIdSchema,
						nullable: true,
					},
				},
				required: [],
			},
			{
				type: 'object',
				properties: {
					granteeUser: {
						type: 'string',
						enum: ['me'],
						nullable: true,
					},
				},
				required: [],
			},
		],
	};

const isGranteeUserQueryParameters = ajv.compile(
	granteeUserQueryParametersSchema,
);

const extractGranteeUserParameters = (
	request: Pick<Request, 'query'> & Partial<AuthContext>,
): GranteeUserParameters => {
	const { query } = request;
	const coercedQuery = coerceQuery(query);
	if (!isGranteeUserQueryParameters(coercedQuery)) {
		throw new InputValidationError(
			'Invalid granteeUser parameters.',
			isGranteeUserQueryParameters.errors ?? [],
		);
	}

	const granteeUserKeycloakUserId =
		coercedQuery.granteeUser === 'me'
			? request.user?.keycloakUserId
			: coercedQuery.granteeUser;

	return {
		granteeUserKeycloakUserId,
	};
};

export { extractGranteeUserParameters };
