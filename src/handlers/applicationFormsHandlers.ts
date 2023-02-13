import { getLogger } from '../logger';
import { db } from '../database';
import {
  isApplicationForm,
  isApplicationFormWrite,
  isApplicationFormFieldArray,
  isApplicationFormArray,
  isTinyPgErrorWithQueryContext,
} from '../types';
import {
  DatabaseError,
  InputValidationError,
  InternalValidationError,
  NotFoundError,
} from '../errors';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';
import type { Result } from 'tinypg';
import type {
  ApplicationForm,
  ApplicationFormWrite,
  ApplicationFormField,
} from '../types';

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

const getShallowApplicationForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  db.sql('applicationForms.selectById', { id: req.params.id })
    .then((applicationFormsQueryResult: Result<ApplicationForm>) => {
      if (applicationFormsQueryResult.row_count === 0) {
        throw new NotFoundError(
          'Not found. Find existing application forms by calling with no parameters.',
        );
      }
      const applicationForm = applicationFormsQueryResult.rows[0];
      if (!isApplicationForm(applicationForm)) {
        throw new InternalValidationError(
          'The database responded with an unexpected format.',
          isApplicationForm.errors ?? [],
        );
      }
      res.status(200)
        .contentType('application/json')
        .send(applicationForm);
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

const getApplicationFormWithFields = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  db.sql('applicationForms.selectById', { id: req.params.id })
    .then((applicationFormsQueryResult: Result<ApplicationForm>) => {
      if (applicationFormsQueryResult.row_count === 0) {
        throw new NotFoundError(
          'Not found. Find existing application forms by calling with no parameters.',
        );
      }
      const baseApplicationForm = applicationFormsQueryResult.rows[0];
      if (!isApplicationForm(baseApplicationForm)) {
        throw new InternalValidationError(
          'The database responded with an unexpected format.',
          isApplicationForm.errors ?? [],
        );
      }
      db.sql('applicationFormFields.selectByApplicationFormId', { applicationFormId: req.params.id })
        .then((applicationFormFieldsQueryResult) => {
          if (!isApplicationFormFieldArray(applicationFormFieldsQueryResult.rows)) {
            throw new InternalValidationError(
              'The database responded with an unexpected format.',
              isApplicationFormFieldArray.errors ?? [],
            );
          }
          const applicationForm = {
            ...baseApplicationForm,
            fields: applicationFormFieldsQueryResult.rows,
          };
          res.status(200)
            .contentType('application/json')
            .send(applicationForm);
        }).catch((error: unknown) => {
          if (isTinyPgErrorWithQueryContext(error)) {
            next(new DatabaseError(
              'Error retrieving application form.',
              error,
            ));
            return;
          }
          next(error);
        });
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error retrieving application form.',
          error,
        ));
        return;
      }
      next(error);
    });
};

const getApplicationForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.query.includeFields !== undefined && req.query.includeFields === 'true') {
    getApplicationFormWithFields(req, res, next);
  } else {
    getShallowApplicationForm(req, res, next);
  }
};

const postApplicationForms = (
  req: Request<unknown, unknown, ApplicationFormWrite>,
  res: Response,
  next: NextFunction,
): void => {
  if (!isApplicationFormWrite(req.body)) {
    next(new InputValidationError(
      'Invalid request body.',
      isApplicationFormWrite.errors ?? [],
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
            next(new InternalValidationError(
              'The database responded with an unexpected format when creating a field.',
              isApplicationFormFieldArray.errors ?? [],
            ));
          }
        }).catch((error: unknown) => {
          if (isTinyPgErrorWithQueryContext(error)) {
            next(new DatabaseError(
              'Error creating application form.',
              error,
            ));
            return;
          }
          next(error);
        });
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format when creating the form.',
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
  getApplicationForm,
  getApplicationForms,
  postApplicationForms,
};
