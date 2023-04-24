import { ajv } from '../ajv';
import { getLogger } from '../logger';
import { db } from '../database';
import {
  isCanonicalFieldArray,
  isCanonicalField,
  isTinyPgErrorWithQueryContext,
} from '../types';
import {
  DatabaseError,
  InputValidationError,
  InternalValidationError,
} from '../errors';
import { jsonSchemaObject } from '../types/JsonSchemaObject';
import type { JSONSchemaType } from 'ajv';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';
import type { Result } from 'tinypg';
import type { CanonicalField } from '../types';

const logger = getLogger(__filename);

const getCanonicalFields = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  db.sql('canonicalFields.selectAll')
    .then((canonicalFieldsQueryResult: Result<CanonicalField>) => {
      logger.debug(canonicalFieldsQueryResult);
      const { rows: canonicalFields } = canonicalFieldsQueryResult;
      if (isCanonicalFieldArray(canonicalFields)) {
        res.status(200)
          .contentType('application/json')
          .send(canonicalFields);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isCanonicalFieldArray.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error retrieving canonical fields.',
          error,
        ));
        return;
      }
      next(error);
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
    dataType: jsonSchemaObject,
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
  next: NextFunction,
): void => {
  if (!isPostCanonicalFieldBody(req.body)) {
    next(new InputValidationError(
      'Invalid request body.',
      isPostCanonicalFieldBody.errors ?? [],
    ));
    return;
  }

  db.sql('canonicalFields.insertOne', req.body)
    .then((canonicalFieldsQueryResult: Result<CanonicalField>) => {
      logger.debug(canonicalFieldsQueryResult);
      const canonicalField = canonicalFieldsQueryResult.rows[0];
      if (isCanonicalField(canonicalField)) {
        res.status(201)
          .contentType('application/json')
          .send(canonicalField);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isCanonicalField.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error creating canonical field.',
          error,
        ));
        return;
      }
      next(error);
    });
};

export const canonicalFieldsHandlers = {
  getCanonicalFields,
  postCanonicalField,
};
