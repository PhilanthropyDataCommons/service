import { TinyPgError } from 'tinypg';
import { ajv } from '../ajv';
import { getLogger } from '../logger';
import {
  db,
  detectUniqueConstraintViolation,
} from '../database';
import {
  isCanonicalFieldArray,
  isCanonicalField,
  isQueryContextWithError,
} from '../types';
import { ValidationError } from '../errors';
import type { JSONSchemaType } from 'ajv';
import type {
  Request,
  Response,
} from 'express';
import type { Result } from 'tinypg';
import type { CanonicalField } from '../types';

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

const postCanonicalFieldBodySchema: JSONSchemaType<Omit<CanonicalField, 'createdAt' | 'id'>> = {
  type: 'object',
  properties: {
    label: {
      type: 'string',
    },
    shortCode: {
      type: 'string',
    },
    dataType: {
      type: 'string',
    },
  },
  required: [
    'label',
    'shortCode',
    'dataType',
  ],
};
const isPostCanonicalFieldBody = ajv.compile(postCanonicalFieldBodySchema);
const postCanonicalField = (
  req: Request<unknown, unknown, Omit<CanonicalField, 'createdAt' | 'id'>>,
  res: Response,
): void => {
  if (!isPostCanonicalFieldBody(req.body)) {
    res.status(400)
      .contentType('application/json')
      .send({
        message: 'Invalid request body.',
        errors: isPostCanonicalFieldBody.errors,
      });
    return;
  }

  db.sql('canonicalFields.insertOne', req.body)
    .then((insertOneQueryResult: Result<CanonicalField>) => {
      logger.debug(insertOneQueryResult);
      const canonicalField = insertOneQueryResult.rows[0];
      if (isCanonicalField(canonicalField)) {
        res.status(201)
          .contentType('application/json')
          .send(canonicalField);
      } else {
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isCanonicalField.errors ?? [],
        );
      }
    })
    .catch((error: unknown) => {
      if (error instanceof TinyPgError
      && isQueryContextWithError(error.queryContext)
      && detectUniqueConstraintViolation(error)) {
        res.status(409)
          .contentType('application/json')
          .send({
            message: 'Unique key constraint violation.',
            errors: [error.queryContext.error],
          });
      } else {
        logger.warn(error);
        res.status(500)
          .contentType('application/json')
          .send(error);
      }
    });
};

export const canonicalFieldsHandlers = {
  getCanonicalFields,
  postCanonicalField,
};
