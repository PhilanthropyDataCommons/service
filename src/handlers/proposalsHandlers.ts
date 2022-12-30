import { getLogger } from '../logger';
import { db } from '../database';
import {
  isProposalArray,
  isProposalWrite,
  isProposal,
  isTinyPgErrorWithQueryContext,
  isProposalRowWithFieldsAndValuesArray,
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
  ProposalFieldValue,
  ProposalRowWithFieldsAndValues,
  ProposalWrite,
  ProposalVersion,
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

export const getValueWithFullFieldFromRow = (row: ProposalRowWithFieldsAndValues):
ProposalFieldValue => {
  if (row.proposalVersionId === undefined
    || row.proposalVersionId === null
    || row.proposalVersionApplicationFormId === undefined
    || row.proposalVersionApplicationFormId === null
    || row.proposalVersionVersion === undefined
    || row.proposalVersionVersion === null
    || row.proposalVersionCreatedAt === undefined
    || row.proposalVersionCreatedAt === null
    || row.proposalFieldValueId === undefined
    || row.proposalFieldValueId === null
    || row.proposalFieldValueApplicationFormFieldId === undefined
    || row.proposalFieldValueApplicationFormFieldId === null
    || row.proposalFieldValueValue === undefined
    || row.proposalFieldValueValue === null
    || row.proposalFieldValuePosition === undefined
    || row.proposalFieldValuePosition === null
    || row.proposalFieldValueCreatedAt === undefined
    || row.proposalFieldValueCreatedAt === null
    || row.applicationFormFieldCanonicalFieldId === undefined
    || row.applicationFormFieldCanonicalFieldId === null
    || row.applicationFormFieldPosition === undefined
    || row.applicationFormFieldPosition === null
    || row.applicationFormFieldLabel === undefined
    || row.applicationFormFieldLabel === null
    || row.applicationFormFieldCreatedAt === undefined
    || row.applicationFormFieldCreatedAt === null) {
    throw new Error('Expected ProposalVersion, ProposalFieldValue, and ApplicationFormField values to be present.');
  }
  return {
    id: row.proposalFieldValueId,
    proposalVersionId: row.proposalVersionId,
    applicationFormFieldId: row.proposalFieldValueApplicationFormFieldId,
    position: row.proposalFieldValuePosition,
    value: row.proposalFieldValueValue,
    createdAt: row.proposalFieldValueCreatedAt,
    applicationFormField: {
      id: row.proposalFieldValueApplicationFormFieldId,
      applicationFormId: row.proposalVersionApplicationFormId,
      canonicalFieldId: row.applicationFormFieldCanonicalFieldId,
      position: row.applicationFormFieldPosition,
      label: row.applicationFormFieldLabel,
      createdAt: row.applicationFormFieldCreatedAt,
    },
  };
};

const getProposalWithFieldsAndValues = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  db.sql('proposals.selectByIdDeep', { id: req.params.id })
    .then((proposalQueryResult: Result<ProposalRowWithFieldsAndValues>) => {
      const { rows: proposalVersionsWithFields } = proposalQueryResult;
      if (proposalVersionsWithFields.length === 0
        || proposalVersionsWithFields[0] === undefined) {
        res.status(404)
          .contentType('application/json')
          .send({ message: 'Not found. Find existing proposals by calling with no parameters.' });
        return;
      }
      if (isProposalRowWithFieldsAndValuesArray(proposalVersionsWithFields)) {
        let currentProposalVersion: ProposalVersion = {
          id: 0,
          proposalId: 0,
          applicationFormId: 0,
          version: -1,
          fieldValues: [],
          createdAt: new Date(),
        };
        const proposalVersions: ProposalVersion[] = [];
        proposalVersionsWithFields.forEach((proposalVersionWithFieldRow) => {
          if (currentProposalVersion.id === proposalVersionWithFieldRow.proposalVersionId) {
            if (proposalVersionWithFieldRow.proposalFieldValueId !== undefined
              && proposalVersionWithFieldRow.proposalFieldValueId !== null) {
              const fieldAndValue = getValueWithFullFieldFromRow(proposalVersionWithFieldRow);
              if (currentProposalVersion.fieldValues === undefined) {
                currentProposalVersion.fieldValues = [fieldAndValue];
              } else {
                currentProposalVersion.fieldValues.push(fieldAndValue);
              }
            }
          } else {
            if (currentProposalVersion.id > 0) {
              proposalVersions.push(currentProposalVersion);
            }
            // It is valid to have a proposal with no versions, likewise a version with no values.
            if (proposalVersionWithFieldRow.proposalVersionId !== undefined
              && proposalVersionWithFieldRow.proposalVersionId !== null
              && proposalVersionWithFieldRow.proposalVersionApplicationFormId !== undefined
              && proposalVersionWithFieldRow.proposalVersionApplicationFormId !== null
              && proposalVersionWithFieldRow.proposalVersionVersion !== undefined
              && proposalVersionWithFieldRow.proposalVersionVersion !== null
              && proposalVersionWithFieldRow.proposalVersionCreatedAt !== undefined
              && proposalVersionWithFieldRow.proposalVersionCreatedAt !== null) {
              currentProposalVersion = {
                id: proposalVersionWithFieldRow.proposalVersionId,
                proposalId: proposalVersionWithFieldRow.id,
                applicationFormId: proposalVersionWithFieldRow.proposalVersionApplicationFormId,
                version: proposalVersionWithFieldRow.proposalVersionVersion,
                createdAt: proposalVersionWithFieldRow.proposalVersionCreatedAt,
                fieldValues: [],
              };
              if (proposalVersionWithFieldRow.proposalFieldValueId !== undefined
                && proposalVersionWithFieldRow.proposalFieldValueId !== null) {
                const fieldAndValue = getValueWithFullFieldFromRow(proposalVersionWithFieldRow);
                // add field to previousRow
                if (currentProposalVersion.fieldValues === undefined) {
                  currentProposalVersion.fieldValues = [fieldAndValue];
                } else {
                  currentProposalVersion.fieldValues.push(fieldAndValue);
                }
              }
            }
          }
        });
        // Include the last row after iteration completes.
        if (currentProposalVersion.id > 0) {
          proposalVersions.push(currentProposalVersion);
        }

        const proposal: Proposal = {
          id: proposalVersionsWithFields[0].id,
          applicantId: proposalVersionsWithFields[0].applicantId,
          opportunityId: proposalVersionsWithFields[0].opportunityId,
          externalId: proposalVersionsWithFields[0].externalId,
          createdAt: proposalVersionsWithFields[0].createdAt,
          versions: proposalVersions,
        };
        res.status(200)
          .contentType('application/json')
          .send(proposal);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isProposalRowWithFieldsAndValuesArray.errors ?? [],
        ));
      }
    })
    .catch((error: unknown) => {
      if (isTinyPgErrorWithQueryContext(error)) {
        next(new DatabaseError(
          'Error retrieving proposal.',
          error,
        ));
        return;
      }
      next(error);
    });
};

const getProposalShallow = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  db.sql('proposals.selectById', { id: req.params.id })
    .then((proposalsQueryResult: Result<Proposal>) => {
      logger.debug(proposalsQueryResult);
      if (proposalsQueryResult.row_count === 0) {
        res.status(404)
          .contentType('application/json')
          .send({ message: 'Not found. Find existing proposals by calling with no parameters.' });
        return;
      }
      const proposal = proposalsQueryResult.rows[0];
      if (isProposal(proposal)) {
        res.status(200)
          .contentType('application/json')
          .send(proposal);
      } else {
        next(new InternalValidationError(
          'The database responded with an unexpected format.',
          isProposal.errors ?? [],
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

const getProposal = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.query.includeFieldsAndValues !== undefined && req.query.includeFieldsAndValues === 'true') {
    getProposalWithFieldsAndValues(req, res, next);
  } else {
    getProposalShallow(req, res, next);
  }
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
  getProposal,
  getProposals,
  postProposal,
};
