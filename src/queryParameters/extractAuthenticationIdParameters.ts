import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';

interface AuthenticationIdParameters {
	authenticationId: string | undefined;
}

const authenticationIdParametersSchema: JSONSchemaType<AuthenticationIdParameters> =
	{
		type: 'object',
		properties: {
			authenticationId: {
				type: 'string',
				nullable: true,
			},
		},
		required: [],
	};

const isAuthenticationIdParameters = ajv.compile(
	authenticationIdParametersSchema,
);

const extractAuthenticationIdParameters = (
	request: Request,
): AuthenticationIdParameters => {
	const { query } = request;
	if (!isAuthenticationIdParameters(query)) {
		throw new InputValidationError(
			'Invalid authenticationId parameter.',
			isAuthenticationIdParameters.errors ?? [],
		);
	}
	return {
		authenticationId: query.authenticationId,
	};
};

export { extractAuthenticationIdParameters };
