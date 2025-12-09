import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { idSchema } from '../types';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { Id } from '../types';

interface ChangemakerParameters {
	changemakerId: Id | undefined;
}

interface ChangemakerParametersQuery {
	changemaker: Id | undefined;
}

const changemakerParametersQuerySchema: JSONSchemaType<ChangemakerParametersQuery> =
	{
		type: 'object',
		properties: {
			changemaker: {
				...idSchema,
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
	const coercedQuery = coerceQuery(query);
	if (!isChangemakerParametersQuery(coercedQuery)) {
		throw new InputValidationError(
			'Invalid changemaker parameters.',
			isChangemakerParametersQuery.errors ?? [],
		);
	}
	return {
		changemakerId: coercedQuery.changemaker,
	};
};

export { extractChangemakerParameters };
