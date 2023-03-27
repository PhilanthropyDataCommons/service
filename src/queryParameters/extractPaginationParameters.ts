import {
  InputValidationError,
} from '../errors';
import {
  isPaginationParametersQuery,
} from '../types';
import apiSpecification from '../openapi.json';
import type {
  Request,
} from 'express';
import type {
  PaginationParameters,
} from '../types';

export const extractPaginationParameters = (
  { query }: Pick<Request, 'query'>,
): PaginationParameters => {
  if (!isPaginationParametersQuery(query)) {
    throw new InputValidationError(
      'Invalid pagination parameters.',
      isPaginationParametersQuery.errors ?? [],
    );
  }
  /* eslint-disable no-underscore-dangle */
  return {
    page: query._page ?? apiSpecification.parameters.pageParam.default,
    count: query._count ?? apiSpecification.parameters.countParam.default,
  };
  /* eslint-enable no-underscore-dangle */
};
