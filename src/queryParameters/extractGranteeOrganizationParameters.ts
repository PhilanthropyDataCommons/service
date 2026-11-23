import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { keycloakIdSchema } from '../types';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { KeycloakId } from '../types';

interface GranteeOrganizationQueryParameters {
	granteeOrganization: KeycloakId | undefined;
}

interface GranteeOrganizationParameters {
	granteeKeycloakOrganizationId: KeycloakId | undefined;
}

const granteeOrganizationQueryParametersSchema: JSONSchemaType<GranteeOrganizationQueryParameters> =
	{
		type: 'object',
		properties: {
			granteeOrganization: {
				...keycloakIdSchema,
				nullable: true,
			},
		},
		required: [],
	};

const isGranteeOrganizationQueryParameters = ajv.compile(
	granteeOrganizationQueryParametersSchema,
);

const extractGranteeOrganizationParameters = (
	request: Pick<Request, 'query'>,
): GranteeOrganizationParameters => {
	const { query } = request;
	const coercedQuery = coerceQuery(query);
	if (!isGranteeOrganizationQueryParameters(coercedQuery)) {
		throw new InputValidationError(
			'Invalid granteeOrganization parameters.',
			isGranteeOrganizationQueryParameters.errors ?? [],
		);
	}
	return {
		granteeKeycloakOrganizationId: coercedQuery.granteeOrganization,
	};
};

export { extractGranteeOrganizationParameters };
