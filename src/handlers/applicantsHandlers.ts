import { getLogger } from '../logger';
import { db } from '../database';
import { isApplicantArray } from '../types';
import { ValidationError } from '../errors';
import type {
  Request,
  Response,
} from 'express';
import type { Result } from 'tinypg';
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

export const applicantsHandlers = {
  getApplicants,
};
