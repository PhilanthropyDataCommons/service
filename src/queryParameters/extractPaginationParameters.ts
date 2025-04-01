import { InputValidationError } from '../errors';
import { isPaginationParametersQuery } from '../types';
import type { Request } from 'express';
import type { PaginationParameters } from '../types';

export const extractPaginationParameters = ({
	query,
}: Pick<Request, 'query'>): PaginationParameters => {
	if (!isPaginationParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid pagination parameters.',
			isPaginationParametersQuery.errors ?? [],
		);
	}
	/* eslint-disable no-underscore-dangle */
	return {
		page: query._page ?? 1,
		count: query._count ?? 10,
	};
	/* eslint-enable no-underscore-dangle */
};
