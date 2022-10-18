import { getLogger } from '../logger';
import { db } from '../database';
import {
  isProposalArray,
  isTinyPgErrorWithQueryContext,
} from '../types';
import {
  DatabaseError,
  InternalValidationError,
} from '../errors';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';
import type { Result } from 'tinypg';
import type { Proposal } from '../types';

const logger = getLogger(__filename);

const getProposals = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  db.sql('proposals.selectAll')
    .then((proposalsQueryResult: Result<Proposal>) => {
      logger.debug(proposalsQueryResult);
      const { rows: proposals } = proposalsQueryResult;
      if (isProposalArray(proposals)) {
        res.status(200)
          .contentType('application/json')
          .send(proposals);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isProposalArray.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error retrieving proposals.',
          error,
        ));
        return;
      }
      next(error);
    });
};

export const proposalsHandlers = {
  getProposals,
};
