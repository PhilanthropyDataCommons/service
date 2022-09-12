import { getLogger } from '../logger';
import {
  db,
} from '../database';
import {
  isApplicationFormArray,
} from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';
import type { Result } from 'tinypg';
import type { ApplicationForm } from '../types';

const logger = getLogger(__filename);

const getApplicationForms = (req: Request, res: Response): void => {
  db.sql('applicationForms.selectAll')
    .then((applicationFormsQueryResult: Result<ApplicationForm>) => {
      logger.debug(applicationFormsQueryResult);
      const { rows: applicationForms } = applicationFormsQueryResult;
      if (isApplicationFormArray(applicationForms)) {
        res.status(200)
          .contentType('application/json')
          .send(applicationForms);
      } else {
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isApplicationFormArray.errors ?? [],
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

export const applicationFormsHandlers = {
  getApplicationForms,
};
