import { getLogger } from '../logger';
import { db } from '../database';
import { isCanonicalFieldArray } from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';

const logger = getLogger(__filename);

const getCanonicalFields = (req: Request, res: Response): void => {
  db.sql('canonicalFields.fetchAll')
    .then((canonicalFields) => {
      logger.debug(canonicalFields, 'canonicalFields.fetchAll');
      const { rows } = canonicalFields;
      if (isCanonicalFieldArray(rows)) {
        res.status(200)
          .contentType('application/json')
          .send(rows);
      } else {
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isCanonicalFieldArray.errors ?? [],
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

export const canonicalFieldsHandlers = {
  getCanonicalFields,
};
