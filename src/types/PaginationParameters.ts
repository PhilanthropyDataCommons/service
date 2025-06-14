import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

const MINIMUM_PAGE_NUMBER = 1;
const MINIMUM_ITEM_COUNT = 1;

export interface PaginationParameters {
	page: number;
	count: number;
}

export const paginationParametersSchema: JSONSchemaType<PaginationParameters> =
	{
		type: 'object',
		properties: {
			page: {
				type: 'integer',
				minimum: MINIMUM_PAGE_NUMBER,
			},
			count: {
				type: 'integer',
				minimum: MINIMUM_ITEM_COUNT,
			},
		},
		required: ['page', 'count'],
	};

export const isPaginationParameters = ajv.compile(paginationParametersSchema);
