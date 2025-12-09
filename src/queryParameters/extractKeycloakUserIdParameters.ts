import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { keycloakIdSchema } from '../types';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { KeycloakId } from '../types';

interface KeycloakUserIdParameters {
	keycloakUserId: KeycloakId | undefined;
}

const keycloakUserIdParametersSchema: JSONSchemaType<KeycloakUserIdParameters> =
	{
		type: 'object',
		properties: {
			keycloakUserId: {
				...keycloakIdSchema,
				nullable: true,
			},
		},
		required: [],
	};

const isKeycloakUserIdParameters = ajv.compile(keycloakUserIdParametersSchema);

const extractKeycloakUserIdParameters = (
	request: Request,
): KeycloakUserIdParameters => {
	const { query } = request;
	const coercedQuery = coerceQuery(query);
	if (!isKeycloakUserIdParameters(coercedQuery)) {
		throw new InputValidationError(
			'Invalid keycloakUserId parameter.',
			isKeycloakUserIdParameters.errors ?? [],
		);
	}
	return {
		keycloakUserId: coercedQuery.keycloakUserId,
	};
};

export { extractKeycloakUserIdParameters };
