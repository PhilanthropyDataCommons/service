import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';

interface ChangemakerParameters {
	changemakerId: number | undefined;
}

interface ChangemakerParametersQuery {
	changemaker: number | undefined;
}

const changemakerParametersQuerySchema: JSONSchemaType<ChangemakerParametersQuery> =
	{
		type: 'object',
		properties: {
			changemaker: {
				type: 'integer',
				minimum: 1,
				nullable: true,
			},
		},
		required: [],
	};

const isChangemakerParametersQuery = ajv.compile(
	changemakerParametersQuerySchema,
);

const extractChangemakerParameters = (
	request: Request,
): ChangemakerParameters => {
	const { query } = request;
	if (!isChangemakerParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid changemaker parameters.',
			isChangemakerParametersQuery.errors ?? [],
		);
	}
	return {
		changemakerId: query.changemaker,
	};
};

export { extractChangemakerParameters };
