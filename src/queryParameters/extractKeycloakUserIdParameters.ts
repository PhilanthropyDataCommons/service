import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { keycloakUserIdSchema } from '../types';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { KeycloakUserId } from '../types';

interface KeycloakUserIdParameters {
	keycloakUserId: KeycloakUserId | undefined;
}

const keycloakUserIdParametersSchema: JSONSchemaType<KeycloakUserIdParameters> =
	{
		type: 'object',
		properties: {
			keycloakUserId: {
				...keycloakUserIdSchema,
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
	if (!isKeycloakUserIdParameters(query)) {
		throw new InputValidationError(
			'Invalid keycloakUserId parameter.',
			isKeycloakUserIdParameters.errors ?? [],
		);
	}
	return {
		keycloakUserId: query.keycloakUserId,
	};
};

export { extractKeycloakUserIdParameters };
