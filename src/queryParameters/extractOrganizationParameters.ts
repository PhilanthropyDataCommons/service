import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';

interface OrganizationParameters {
	organizationId: number | undefined;
}

interface OrganizationParametersQuery {
	organization: number | undefined;
}

const organizationParametersQuerySchema: JSONSchemaType<OrganizationParametersQuery> =
	{
		type: 'object',
		properties: {
			organization: {
				type: 'integer',
				minimum: 1,
				nullable: true,
			},
		},
		required: [],
	};

const isOrganizationParametersQuery = ajv.compile(
	organizationParametersQuerySchema,
);

const extractOrganizationParameters = (
	request: Request,
): OrganizationParameters => {
	const { query } = request;
	if (!isOrganizationParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid organization parameters.',
			isOrganizationParametersQuery.errors ?? [],
		);
	}
	return {
		organizationId: query.organization,
	};
};

export { extractOrganizationParameters };
