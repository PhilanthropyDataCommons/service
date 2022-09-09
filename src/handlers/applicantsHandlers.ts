import { TinyPgError } from 'tinypg';
import { ajv } from '../ajv';
import { getLogger } from '../logger';
import {
  db,
  detectUniqueConstraintViolation,
} from '../database';
import {
  isApplicant,
  isApplicantArray,
  isQueryContextWithError,
} from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';
import type { Result } from 'tinypg';
import type { JSONSchemaType } from 'ajv';
import type { Applicant } from '../types';

const logger = getLogger(__filename);

const getApplicants = (req: Request, res: Response): void => {
  db.sql('applicants.selectAll')
    .then((applicantsQueryResult: Result<Applicant>) => {
      logger.debug(applicantsQueryResult);
      const { rows: applicants } = applicantsQueryResult;
      if (isApplicantArray(applicants)) {
        res.status(200)
          .contentType('application/json')
          .send(applicants);
      } else {
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isApplicantArray.errors ?? [],
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

const postApplicantsBodySchema: JSONSchemaType<Omit<Applicant, 'createdAt' | 'id' | 'optedIn'>> = {
  type: 'object',
  properties: {
    externalId: {
      type: 'string',
    },
  },
  required: [
    'externalId',
  ],
};
const isPostApplicantsBody = ajv.compile(postApplicantsBodySchema);
const postApplicants = (
  req: Request<unknown, unknown, Omit<Applicant, 'createdAt' | 'id' | 'optedIn'>>,
  res: Response,
): void => {
  if (!isPostApplicantsBody(req.body)) {
    res.status(400)
      .contentType('application/json')
      .send({
        message: 'Invalid request body.',
        errors: isPostApplicantsBody.errors,
      });
    return;
  }

  db.sql('applicants.insertOne', {
    ...req.body,
    optedIn: false,
  })
    .then((applicantsQueryResult: Result<Applicant>) => {
      logger.debug(applicantsQueryResult);
      const canonicalField = applicantsQueryResult.rows[0];
      if (isApplicant(canonicalField)) {
        res.status(201)
          .contentType('application/json')
          .send(canonicalField);
      } else {
        throw new ValidationError(
          'The database responded with an unexpected format.',
          isApplicant.errors ?? [],
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

export const applicantsHandlers = {
  getApplicants,
  postApplicants,
};
