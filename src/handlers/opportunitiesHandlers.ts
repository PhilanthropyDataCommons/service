import { ajv } from '../ajv';
import { getLogger } from '../logger';
import { db } from '../database';
import {
  isOpportunityArray,
  isOpportunity,
  isTinyPgErrorWithQueryContext,
} from '../types';
import {
  DatabaseError,
  InputValidationError,
  InternalValidationError,
} from '../errors';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';
import type { Result } from 'tinypg';
import type { JSONSchemaType } from 'ajv';
import type { Opportunity } from '../types';

const logger = getLogger(__filename);

const getOpportunities = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  db.sql('opportunities.selectAll')
    .then((opportunitiesQueryResult: Result<Opportunity>) => {
      logger.debug(opportunitiesQueryResult);
      const { rows: opportunities } = opportunitiesQueryResult;
      if (isOpportunityArray(opportunities)) {
        res.status(200)
          .contentType('application/json')
          .send(opportunities);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isOpportunityArray.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error retrieving opportunity.',
          error,
        ));
        return;
      }
      next(error);
    });
};

interface GetOpportunityParams {
  id: number;
}
const getOpportunityParamsSchema: JSONSchemaType<GetOpportunityParams> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
    },
  },
  required: [
    'id',
  ],
};
const isGetOpportunityParams = ajv.compile(getOpportunityParamsSchema);
const getOpportunity = (
  req: Request<GetOpportunityParams>,
  res: Response,
  next: NextFunction,
): void => {
  if (!isGetOpportunityParams(req.params)) {
    next(new InputValidationError(
      'Invalid request parameters.',
      isGetOpportunityParams.errors ?? [],
    ));
    return;
  }
  db.sql('opportunities.selectById', { id: req.params.id })
    .then((opportunitiesQueryResult: Result<Opportunity>) => {
      logger.debug(opportunitiesQueryResult);
      if (opportunitiesQueryResult.row_count === 0) {
        res.status(404)
          .contentType('application/json')
          .send({ message: 'Not found. Find existing opportunities by calling with no parameters.' });
        return;
      }

      const opportunity = opportunitiesQueryResult.rows[0];
      if (isOpportunity(opportunity)) {
        res.status(200)
          .contentType('application/json')
          .send(opportunity);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isOpportunity.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error retrieving opportunity.',
          error,
        ));
        return;
      }
      next(error);
    });
};

const postOpportunitiesBodySchema: JSONSchemaType<Omit<Opportunity, 'createdAt' | 'id'>> = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
    },
  },
  required: [
    'title',
  ],
};
const isPostOpportunitiesBodySchema = ajv.compile(postOpportunitiesBodySchema);
const postOpportunity = (
  req: Request<unknown, unknown, Omit<Opportunity, 'createdAt' | 'id'>>,
  res: Response,
  next: NextFunction,
): void => {
  logger.debug(req);

  if (!isPostOpportunitiesBodySchema(req.body)) {
    next(new InputValidationError(
      'Invalid request parameters.',
      isPostOpportunitiesBodySchema.errors ?? [],
    ));
    return;
  }

  db.sql('opportunities.insertOne', req.body)
    .then((opportunitiesQueryResult: Result<Opportunity>) => {
      logger.debug(opportunitiesQueryResult);
      const opportunity = opportunitiesQueryResult.rows[0];
      if (isOpportunity(opportunity)) {
        res.status(201)
          .contentType('application/json')
          .send(opportunity);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isOpportunity.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error creating opportunity.',
          error,
        ));
        return;
      }
      next(error);
    });
};

export const opportunitiesHandlers = {
  getOpportunities,
  getOpportunity,
  postOpportunity,
};
