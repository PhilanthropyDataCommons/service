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
import type { Opportunity } from '../types';

const logger = getLogger(__filename);

const getOpportunities = (req: Request, res: Response): void => {
  db.sql('opportunities.fetchAll')
    .then((opportunities) => {
      const { rows } = opportunities;
      logger.debug(opportunities);
      if (isOpportunityArraySchema(rows)) {
        res.status(200)
          .contentType('application/json')
          .send(rows);
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

const getOpportunity = (req: Request, res: Response): void => {
  const isInteger = (it: string): boolean => !Number.isNaN(parseInt(it, 10))
    && parseInt(it, 10) % 1 === 0;

  if (!isInteger(req.params.id)) {
    res.status(400)
      .contentType('application/json')
      .send({ message: 'Bad request. Send an integer id or call with no parameters.' });
    return;
  }

  logger.debug(req);
  db.sql('opportunities.fetchById', { id: req.params.id })
    .then((opportunity: Result<Opportunity>) => {
      logger.debug(opportunity);
      if (opportunity.row_count === 0) {
        res.status(404)
          .contentType('application/json')
          .send({ message: 'Not found. Find existing opportunities by calling with no parameters.' });
        return;
      }

      const { rows } = opportunity;

      if (isOpportunity(rows[0])) {
        res.status(200)
          .contentType('application/json')
          .send(rows[0]);
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
