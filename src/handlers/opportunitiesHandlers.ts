import { ajv } from '../ajv';
import { getLogger } from '../logger';
import { db } from '../database';
import {
  isOpportunityArraySchema,
  isOpportunity,
} from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';
import type { Result } from 'tinypg';
import type { JSONSchemaType } from 'ajv';
import type { Opportunity } from '../types';

const logger = getLogger(__filename);

const getOpportunities = (req: Request, res: Response): void => {
  db.sql('opportunities.selectAll')
    .then((opportunitiesQueryResult: Result<Opportunity>) => {
      logger.debug(opportunitiesQueryResult);
      const { rows: opportunities } = opportunitiesQueryResult;
      if (isOpportunityArraySchema(opportunities)) {
        res.status(200)
          .contentType('application/json')
          .send(opportunities);
      } else {
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isOpportunityArraySchema.errors ?? [],
        );
      }
    })
    .catch((error: unknown) => {
      logger.error(error);
      res.status(500)
        .contentType('application/json')
        .send(error);
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
const getOpportunity = (req: Request<GetOpportunityParams>, res: Response): void => {
  if (!isGetOpportunityParams(req.params)) {
    res.status(400)
      .contentType('application/json')
      .send({
        message: 'Invalid request parameters.',
        errors: isGetOpportunityParams.errors,
      });
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
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isOpportunity.errors ?? [],
        );
      }
    })
    .catch((error: unknown) => {
      logger.error(error);
      res.status(500)
        .contentType('application/json')
        .send(error);
    });
};

export const opportunitiesHandlers = {
  getOpportunities,
  getOpportunity,
};
