import { getLogger } from '../logger';
import { db } from '../database';
import { isOpportunityArraySchema } from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';

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

export const opportunitiesHandlers = {
  getOpportunities,
};
