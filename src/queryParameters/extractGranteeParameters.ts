import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { keycloakIdSchema } from '../types';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { KeycloakId } from '../types';

interface GranteeParameters {
	granteeUserKeycloakUserId: KeycloakId | undefined;
	granteeKeycloakOrganizationId: KeycloakId | undefined;
}

interface GranteeParametersQuery {
	granteeUser: KeycloakId | undefined;
	granteeOrganization: KeycloakId | undefined;
}

const granteeParametersQuerySchema: JSONSchemaType<GranteeParametersQuery> = {
	type: 'object',
	properties: {
		granteeUser: {
			...keycloakIdSchema,
			nullable: true,
		},
		granteeOrganization: {
			...keycloakIdSchema,
			nullable: true,
		},
	},
	required: [],
};

const isGranteeParametersQuery = ajv.compile(granteeParametersQuerySchema);

const extractGranteeParameters = (request: Request): GranteeParameters => {
	const { query } = request;
	const coercedQuery = coerceQuery(query);
	if (!isGranteeParametersQuery(coercedQuery)) {
		throw new InputValidationError(
			'Invalid grantee parameters.',
			isGranteeParametersQuery.errors ?? [],
		);
	}
	return {
		granteeUserKeycloakUserId: coercedQuery.granteeUser,
		granteeKeycloakOrganizationId: coercedQuery.granteeOrganization,
	};
};

export { extractGranteeParameters };
