import { getLogger } from '../logger';
import { db } from '../database';
import {
  isApplicationForm,
  isApplicationFormWrite,
  isApplicationFormArray,
  isApplicationFormFieldArray,
} from '../types';
import { ValidationError } from '../errors';
import { handleDbPromiseFailure } from '../tools/utils';
import type {
  Request,
  Response,
} from 'express';
import type { Result } from 'tinypg';
import type {
  ApplicationForm,
  ApplicationFormWrite,
  ApplicationFormField,
} from '../types';

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

const postApplicationForms = (
  req: Request<unknown, unknown, ApplicationFormWrite>,
  res: Response,
): void => {
  if (!isApplicationFormWrite(req.body)) {
    res.status(400)
      .contentType('application/json')
      .send({
        message: 'Invalid request body.',
        errors: isApplicationFormWrite.errors,
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
        const queries = req.body.fields.map(async (field) => (
          db.sql('applicationFormFields.insertOne', {
            ...field,
            applicationFormId: applicationForm.id,
          })
        ));
        Promise.all<Result<ApplicationFormField>>(
          queries,
        ).then((applicationFormFieldsQueryResults) => {
          const applicationFormFields = applicationFormFieldsQueryResults.map(
            (applicationFormFieldsQueryResult) => applicationFormFieldsQueryResult.rows[0],
          );
          if (isApplicationFormFieldArray(applicationFormFields)) {
            res.status(201)
              .contentType('application/json')
              .send({
                ...applicationForm,
                fields: applicationFormFields,
              });
          } else {
            throw new ValidationError(
              'The database responded with an unexpected format.',
              isApplicationFormFieldArray.errors ?? [],
            );
          }
        }).catch((error: unknown) => {
          handleDbPromiseFailure(error, res, logger);
        });
      } else {
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isApplicationForm.errors ?? [],
        );
      }
    })
    .catch((error: unknown) => {
      handleDbPromiseFailure(error, res, logger);
    });
};

export const applicationFormsHandlers = {
  getApplicationForms,
  postApplicationForms,
};
