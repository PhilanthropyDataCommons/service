import { InputValidationError } from '../errors';
import { isPaginationParametersQuery } from '../types';
import { coerceQuery } from '../coercion';
import type { Request } from 'express';
import type { PaginationParameters } from '../types';

const DEFAULT_PAGE = 1;
const DEFAULT_COUNT = 10;

export const extractPaginationParameters = ({
	query,
}: Pick<Request, 'query'>): PaginationParameters => {
	const coercedQuery = coerceQuery(query);
	if (!isPaginationParametersQuery(coercedQuery)) {
		throw new InputValidationError(
			'Invalid pagination parameters.',
			isPaginationParametersQuery.errors ?? [],
		);
	}

	return {
		page: coercedQuery._page ?? DEFAULT_PAGE,
		count: coercedQuery._count ?? DEFAULT_COUNT,
	};
};
