import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface PaginationParametersQuery {
	_page: number | undefined | null;
	_count: number | undefined | null;
}

export const paginationParametersQuerySchema: JSONSchemaType<PaginationParametersQuery> =
	{
		type: 'object',
		properties: {
			_page: {
				type: 'integer',
				minimum: 1,
				nullable: true,
			},
			_count: {
				type: 'integer',
				minimum: 1,
				nullable: true,
			},
		},
		required: [],
	};

export const isPaginationParametersQuery = ajv.compile(
	paginationParametersQuerySchema,
);
