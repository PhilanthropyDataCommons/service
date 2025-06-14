import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

const MINIMUM_PAGE_NUMBER = 1;
const MINIMUM_ITEM_COUNT = 1;

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
				minimum: MINIMUM_PAGE_NUMBER,
				nullable: true,
			},
			_count: {
				type: 'integer',
				minimum: MINIMUM_ITEM_COUNT,
				nullable: true,
			},
		},
		required: [],
	};

export const isPaginationParametersQuery = ajv.compile(
	paginationParametersQuerySchema,
);
