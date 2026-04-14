import { ajv } from '../ajv';
import { InputValidationError } from '../errors';
import { coerceQuery } from '../coercion';
import type { JSONSchemaType } from 'ajv';
import type { Request } from 'express';

interface IsCollaborativeParameters {
	isCollaborative: boolean | undefined;
}

const isCollaborativeParametersQuerySchema: JSONSchemaType<IsCollaborativeParameters> =
	{
		type: 'object',
		properties: {
			isCollaborative: {
				type: 'boolean',
				nullable: true,
			},
		},
		required: [],
	};

const isIsCollaborativeParametersQuery = ajv.compile(
	isCollaborativeParametersQuerySchema,
);

const extractIsCollaborativeParameters = ({
	query,
}: Pick<Request, 'query'>): IsCollaborativeParameters => {
	const coercedQuery = coerceQuery(query);
	if (!isIsCollaborativeParametersQuery(coercedQuery)) {
		throw new InputValidationError(
			'Invalid isCollaborative parameter.',
			isIsCollaborativeParametersQuery.errors ?? [],
		);
	}
	return {
		isCollaborative: coercedQuery.isCollaborative,
	};
};

export { extractIsCollaborativeParameters };
