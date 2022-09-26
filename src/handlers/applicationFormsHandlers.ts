import { ajv } from '../ajv';
import { getLogger } from '../logger';
import { db } from '../database';
import {
  isApplicationForm,
  isApplicationFormArray,
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
import type { ApplicationForm } from '../types';

const logger = getLogger(__filename);

const getApplicationForms = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  db.sql('applicationForms.selectAll')
    .then((applicationFormsQueryResult: Result<ApplicationForm>) => {
      logger.debug(applicationFormsQueryResult);
      const { rows: applicationForms } = applicationFormsQueryResult;
      if (isApplicationFormArray(applicationForms)) {
        res.status(200)
          .contentType('application/json')
          .send(applicationForms);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isApplicationFormArray.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error retrieving application forms.',
          error,
        ));
        return;
      }
      next(error);
    });
};

const postApplicationFormsBodySchema: JSONSchemaType<Omit<ApplicationForm, 'createdAt' | 'id' | 'version'>> = {
  type: 'object',
  properties: {
    opportunityId: {
      type: 'number',
    },
  },
  required: [
    'opportunityId',
  ],
};
const isPostApplicationFormsBody = ajv.compile(postApplicationFormsBodySchema);
const postApplicationForms = (
  req: Request<unknown, unknown, Omit<ApplicationForm, 'createdAt' | 'id' | 'version'>>,
  res: Response,
  next: NextFunction,
): void => {
  if (!isPostApplicationFormsBody(req.body)) {
    next(new InputValidationError(
      'Invalid request body.',
      isPostApplicationFormsBody.errors ?? [],
    ));
    return;
  }

  db.sql('applicationForms.insertOne', {
    ...req.body,
    optedIn: false,
  })
    .then((applicationFormsQueryResult: Result<ApplicationForm>) => {
      logger.debug(applicationFormsQueryResult);
      const applicationForm = applicationFormsQueryResult.rows[0];
      if (isApplicationForm(applicationForm)) {
        res.status(201)
          .contentType('application/json')
          .send(applicationForm);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isApplicationForm.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error creating application form.',
          error,
        ));
        return;
      }
      next(error);
    });
};

export const applicationFormsHandlers = {
  getApplicationForms,
  postApplicationForms,
};
