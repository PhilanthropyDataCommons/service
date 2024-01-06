import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

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
				minimum: 1,
			},
			count: {
				type: 'integer',
				minimum: 1,
			},
		},
		required: ['page', 'count'],
	};

export const isPaginationParameters = ajv.compile(paginationParametersSchema);
