import apiSpecification from '../openapi.json';
import { SimpleInputValidationError } from '../errors';
import type { Request } from 'express';

export const extractOpportunityIdParameter = (
  request: Request,
) => {
  if (request.query.opportunityId !== undefined
    && request.query.opportunityId !== '') {
    const id = Number(request.query.opportunityId);
    if (!Number.isSafeInteger(id)) {
      throw new SimpleInputValidationError(`opportunityId must be an integer, got '${id}'.`);
    }
    return { opportunityId: id };
  }
  return {
    opportunityId: apiSpecification.components.parameters.opportunityIdParam.schema.default,
  };
};
