import { TinyPgError } from 'tinypg';
import { ajv } from '../ajv';
import { getLogger } from '../logger';
import {
  db,
  PostgressErrorCode,
} from '../database';
import {
  isApplicationForm,
  isApplicationFormArray,
  isQueryContextWithError,
} from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';
import type { Result } from 'tinypg';
import type { JSONSchemaType } from 'ajv';
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

const postApplicantionFormsBodySchema: JSONSchemaType<Omit<ApplicationForm, 'createdAt' | 'id' | 'version'>> = {
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
const isPostApplicantionFormsBody = ajv.compile(postApplicantionFormsBodySchema);
const postApplicationForms = (
  req: Request<unknown, unknown, Omit<ApplicationForm, 'createdAt' | 'id' | 'version'>>,
  res: Response,
): void => {
  if (!isPostApplicantionFormsBody(req.body)) {
    res.status(400)
      .contentType('application/json')
      .send({
        message: 'Invalid request body.',
        errors: isPostApplicantionFormsBody.errors,
      });
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
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isApplicationForm.errors ?? [],
        );
      }
    })
    .catch((error: unknown) => {
      if (error instanceof TinyPgError
      && isQueryContextWithError(error.queryContext)) {
        switch (error.queryContext.error.code) {
          case PostgressErrorCode.FOREIGN_KEY_VIOLATION:
            res.status(409)
              .contentType('application/json')
              .send({
                message: 'Unique key constraint violation.',
                errors: [error.queryContext.error],
              });
            return;
          case PostgressErrorCode.UNIQUE_VIOLATION:
            res.status(409)
              .contentType('application/json')
              .send({
                message: 'Unique key constraint violation.',
                errors: [error.queryContext.error],
              });
            return;
          default:
        }
      }
      logger.warn(error);
      res.status(500)
        .contentType('application/json')
        .send(error);
    });
};

export const applicationFormsHandlers = {
  getApplicationForms,
  postApplicationForms,
};
