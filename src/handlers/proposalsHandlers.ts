import { getLogger } from '../logger';
import { db } from '../database';
import {
  isProposalArray,
  isProposalWrite,
  isProposal,
  isTinyPgErrorWithQueryContext,
} from '../types';
import {
  DatabaseError,
  InternalValidationError,
  InputValidationError,
} from '../errors';
import type {
  Request,
  Response,
  NextFunction,
} from 'express';
import type { Result } from 'tinypg';
import type {
  Proposal,
  ProposalWrite,
} from '../types';

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

const postProposal = (
  req: Request<unknown, unknown, ProposalWrite>,
  res: Response,
  next: NextFunction,
): void => {
  if (!isProposalWrite(req.body)) {
    next(new InputValidationError(
      'Invalid request body.',
      isProposalWrite.errors ?? [],
    ));
    return;
  }

  db.sql('proposals.insertOne', req.body)
    .then((proposalQueryResult: Result<Proposal>) => {
      logger.debug(proposalQueryResult);
      const proposal = proposalQueryResult.rows[0];
      if (isProposal(proposal)) {
        res.status(201)
          .contentType('application/json')
          .send(proposal);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format when creating the proposal.',
          isProposal.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error creating proposal.',
          error,
        ));
        return;
      }
      next(error);
    });
};

export const proposalsHandlers = {
  getProposals,
  postProposal,
};
