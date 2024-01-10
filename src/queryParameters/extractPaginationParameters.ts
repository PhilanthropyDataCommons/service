import { InputValidationError } from '../errors';
import { isPaginationParametersQuery } from '../types';
import apiSpecification from '../openapi.json';
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
		page:
			query._page ??
			apiSpecification.components.parameters.pageParam.schema.default,
		count:
			query._count ??
			apiSpecification.components.parameters.countParam.schema.default,
	};
	/* eslint-enable no-underscore-dangle */
};
