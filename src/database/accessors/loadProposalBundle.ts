import { loadBundle } from './loadBundle';
import type { TinyPgParams } from 'tinypg';
import type {
  Bundle,
  Proposal,
  ProposalVersion,
  ProposalFieldValue,
  ApplicationFormField,
} from '../../types';

/* eslint-disable @typescript-eslint/no-type-alias */
type AddPrefixToObject<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K]
};
/* eslint-enable @typescript-eslint/no-type-alias */

const filterByDistinctId = (
  candidateItem: { id: number },
  index: number,
  self: { id: number }[],
) => index === self.findIndex(
  (item) => item.id === candidateItem.id,
);

// See https://github.com/typescript-eslint/typescript-eslint/issues/1824
/* eslint-disable @typescript-eslint/indent */
type ProposalPiece = AddPrefixToObject<Proposal, 'proposal_'>;
type ProposalVersionPiece = AddPrefixToObject<ProposalVersion, 'proposalVersion_'>;
type ProposalFieldValuePiece = AddPrefixToObject<ProposalFieldValue, 'proposalFieldValue_'>;
type ApplicationFormFieldPiece = AddPrefixToObject<ApplicationFormField, 'applicationFormField_'>;
/* eslint-enable @typescript-eslint/indent */

const isApplicationFormFieldPiece = (
  o: Record<string, unknown>,
): o is ApplicationFormFieldPiece => (
  'applicationFormField_id' in o
);
const isProposalFieldValuePiece = (
  o: Record<string, unknown>,
): o is ProposalFieldValuePiece => (
  'proposalFieldValue_id' in o
);
const isProposalVersionPiece = (
  o: Record<string, unknown>,
): o is ProposalVersionPiece => (
  'proposalVersion_id' in o
);
const isProposalPiece = (
  o: Record<string, unknown>,
): o is ProposalPiece => (
  'proposal_id' in o
);

const extractApplicationFormFields = (
  applicationFormFieldPieces: ApplicationFormFieldPiece[],
): ApplicationFormField[] => (
  applicationFormFieldPieces.reduce<ApplicationFormField[]>(
    (applicationFormFields, applicationFormFieldPiece) => [
      ...applicationFormFields,
      {
        id: applicationFormFieldPiece.applicationFormField_id,
        applicationFormId: applicationFormFieldPiece.applicationFormField_applicationFormId,
        canonicalFieldId: applicationFormFieldPiece.applicationFormField_canonicalFieldId,
        position: applicationFormFieldPiece.applicationFormField_position,
        label: applicationFormFieldPiece.applicationFormField_label,
        createdAt: applicationFormFieldPiece.applicationFormField_createdAt,
      },
    ],
    [],
  ).filter(filterByDistinctId)
);

const extractProposalFieldValues = (
  proposalFieldValuePieces: ProposalFieldValuePiece[],
): ProposalFieldValue[] => (
  proposalFieldValuePieces.reduce<ProposalFieldValue[]>(
    (proposalFieldValues, proposalFieldValuePiece) => [
      ...proposalFieldValues,
      {
        id: proposalFieldValuePiece.proposalFieldValue_id,
        proposalVersionId: proposalFieldValuePiece.proposalFieldValue_proposalVersionId,
        applicationFormFieldId: proposalFieldValuePiece.proposalFieldValue_applicationFormFieldId,
        position: proposalFieldValuePiece.proposalFieldValue_position,
        value: proposalFieldValuePiece.proposalFieldValue_value,
        createdAt: proposalFieldValuePiece.proposalFieldValue_createdAt,
      },
    ],
    [],
  ).filter(filterByDistinctId)
);

const extractProposalVersions = (
  proposalVersionPieces: ProposalVersionPiece[],
): ProposalVersion[] => (
  proposalVersionPieces.reduce<ProposalVersion[]>(
    (proposalVersions, proposalVersionPiece) => [
      ...proposalVersions,
      {
        id: proposalVersionPiece.proposalVersion_id,
        proposalId: proposalVersionPiece.proposalVersion_proposalId,
        applicationFormId: proposalVersionPiece.proposalVersion_applicationFormId,
        version: proposalVersionPiece.proposalVersion_version,
        createdAt: proposalVersionPiece.proposalVersion_createdAt,
      },
    ],
    [],
  ).filter(filterByDistinctId)
);

const extractProposals = (
  proposalPieces: ProposalPiece[],
): Proposal[] => (
  proposalPieces.reduce<Proposal[]>(
    (proposals, proposalPiece) => [
      ...proposals,
      {
        id: proposalPiece.proposal_id,
        applicantId: proposalPiece.proposal_applicantId,
        opportunityId: proposalPiece.proposal_opportunityId,
        externalId: proposalPiece.proposal_externalId,
        createdAt: proposalPiece.proposal_createdAt,
      },
    ],
    [],
  ).filter(filterByDistinctId)
);

const joinProposalFieldValuesWithApplicationFormFields = (
  proposalFieldValues: ProposalFieldValue[],
  applicationFormFields: ApplicationFormField[],
): ProposalFieldValue[] => (
  proposalFieldValues.map((proposalFieldValue) => ({
    ...proposalFieldValue,
    applicationFormField: applicationFormFields.find(
      (applicationFormField) => (
        applicationFormField.id === proposalFieldValue.applicationFormFieldId
      ),
    ),
  }))
);

const joinProposalVersionsWithProposalFieldValues = (
  proposalVersions: ProposalVersion[],
  proposalFieldValues: ProposalFieldValue[],
): ProposalVersion[] => (
  proposalVersions.map((proposalVersion) => ({
    ...proposalVersion,
    fieldValues: proposalFieldValues.filter(
      (proposalFieldValue) => proposalFieldValue.proposalVersionId === proposalVersion.id,
    ),
  }))
);

const joinProposalsWithProposalVersions = (
  proposals: Proposal[],
  proposalVersions: ProposalVersion[],
): Proposal[] => (
  proposals.map((proposal) => ({
    ...proposal,
    versions: proposalVersions.filter(
      (proposalVersion) => proposalVersion.proposalId === proposal.id,
    ),
  }))
);

export const joinProposalFieldValuesToProposalVersion = (
  proposalVersion: ProposalVersion,
  values: ProposalFieldValue[],
): ProposalVersion => {
  const newVersion = structuredClone(proposalVersion);
  values.forEach((proposalFieldValue) => {
    if (newVersion.fieldValues === undefined) {
      newVersion.fieldValues = [];
    }
    if (proposalFieldValue.proposalVersionId === newVersion.id) {
      newVersion.fieldValues.push(proposalFieldValue);
    }
  });
  return newVersion;
};

export const loadProposalBundle = async (
  queryParameters: TinyPgParams,
): Promise<Bundle<Proposal>> => {
  // See https://github.com/typescript-eslint/typescript-eslint/issues/1824
  /* eslint-disable @typescript-eslint/indent */
  const unprocessedBundle = await loadBundle<ProposalPiece
    | ProposalVersionPiece
    | ProposalFieldValuePiece
    | ApplicationFormFieldPiece>(
  /* eslint-enable @typescript-eslint/indent */
    'proposals.selectWithPagination',
    queryParameters,
    'proposals',
  );
  const deepProposalPieces = unprocessedBundle.entries;
  const applicationFormFields = extractApplicationFormFields(
    deepProposalPieces.filter(isApplicationFormFieldPiece),
  );
  const proposalFieldValues = joinProposalFieldValuesWithApplicationFormFields(
    extractProposalFieldValues(
      deepProposalPieces.filter(isProposalFieldValuePiece),
    ),
    applicationFormFields,
  );
  const proposalVersions = joinProposalVersionsWithProposalFieldValues(
    extractProposalVersions(
      deepProposalPieces.filter(isProposalVersionPiece),
    ),
    proposalFieldValues,
  );
  const proposals = joinProposalsWithProposalVersions(
    extractProposals(
      deepProposalPieces.filter(isProposalPiece),
    ),
    proposalVersions,
  );
  return {
    ...unprocessedBundle,
    entries: proposals,
  };
};
