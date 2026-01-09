import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { idSchema } from '../types';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';
import type { Id } from '../types';

interface ChangemakerFieldValueBatchParameters {
	changemakerFieldValueBatchId: Id | undefined;
}

interface ChangemakerFieldValueBatchParametersQuery {
	changemakerFieldValueBatch: Id | undefined;
}

const changemakerFieldValueBatchParametersQuerySchema: JSONSchemaType<ChangemakerFieldValueBatchParametersQuery> =
	{
		type: 'object',
		properties: {
			changemakerFieldValueBatch: {
				...idSchema,
				nullable: true,
			},
		},
		required: [],
	};

const isChangemakerFieldValueBatchParametersQuery = ajv.compile(
	changemakerFieldValueBatchParametersQuerySchema,
);

const extractChangemakerFieldValueBatchParameters = (
	request: Request,
): ChangemakerFieldValueBatchParameters => {
	const { query } = request;
	const coercedQuery = coerceQuery(query);
	if (!isChangemakerFieldValueBatchParametersQuery(coercedQuery)) {
		throw new InputValidationError(
			'Invalid changemakerFieldValueBatch parameters.',
			isChangemakerFieldValueBatchParametersQuery.errors ?? [],
		);
	}
	return {
		changemakerFieldValueBatchId: coercedQuery.changemakerFieldValueBatch,
	};
};

export { extractChangemakerFieldValueBatchParameters };
