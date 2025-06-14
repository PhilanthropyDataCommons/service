import { InputValidationError } from '../errors';
import { isPaginationParametersQuery } from '../types';
import type { Request } from 'express';
import type { PaginationParameters } from '../types';

const DEFAULT_PAGE = 1;
const DEFAULT_COUNT = 10;

export const extractPaginationParameters = ({
	query,
}: Pick<Request, 'query'>): PaginationParameters => {
	if (!isPaginationParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid pagination parameters.',
			isPaginationParametersQuery.errors ?? [],
		);
	}

	return {
		page: query._page ?? DEFAULT_PAGE,
		count: query._count ?? DEFAULT_COUNT,
	};
};
