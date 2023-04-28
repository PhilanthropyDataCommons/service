import apiSpecification from '../openapi.json';
import type {
  Request,
} from 'express';

export const extractSearchParameters = (
  request: Request,
) => ({
  /* eslint-disable no-underscore-dangle */
  search: request.query._content
    ?? apiSpecification.components.parameters.searchParam.schema.default,
  /* eslint-enable no-underscore-dangle */
});
