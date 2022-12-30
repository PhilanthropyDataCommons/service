import { ajv } from '../ajv';
import { proposalVersionSchema } from './ProposalVersion';
import type { JSONSchemaType } from 'ajv';
import type { ProposalVersion } from './ProposalVersion';

export interface Proposal {
  id: number;
  applicantId: number;
  opportunityId: number;
  externalId: string;
  versions?: ProposalVersion[];
  createdAt: Date;
}

export interface ProposalRowWithFieldsAndValues {
  readonly id: number;
  readonly applicantId: number;
  readonly opportunityId: number;
  readonly externalId: string;
  readonly createdAt: Date;
  readonly proposalVersionId?: number | null;
  readonly proposalVersionApplicationFormId?: number | null;
  readonly proposalVersionVersion?: number | null;
  readonly proposalVersionCreatedAt?: Date | null;
  readonly proposalFieldValueId?: number | null;
  readonly proposalFieldValueApplicationFormFieldId?: number | null;
  readonly proposalFieldValueValue?: string | null;
  readonly proposalFieldValuePosition?: number | null;
  readonly proposalFieldValueCreatedAt?: Date | null;
  readonly applicationFormFieldCanonicalFieldId?: number | null;
  readonly applicationFormFieldPosition?: number | null;
  readonly applicationFormFieldLabel?: string | null;
  readonly applicationFormFieldCreatedAt?: Date | null;
}

// See https://github.com/typescript-eslint/typescript-eslint/issues/1824
/* eslint-disable @typescript-eslint/indent */
export type ProposalWrite = Omit<Proposal, 'createdAt' | 'id' | 'versions'>;
/* eslint-enable @typescript-eslint/indent */

export const proposalSchema: JSONSchemaType<Proposal> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    applicantId: {
      type: 'integer',
    },
    opportunityId: {
      type: 'integer',
    },
    externalId: {
      type: 'string',
      pattern: '.+',
    },
    versions: {
      type: 'array',
      items: proposalVersionSchema,
      nullable: true,
    },
    createdAt: {
      type: 'object',
      required: [],
      instanceof: 'Date',
    },
  },
  required: [
    'id',
    'applicantId',
    'opportunityId',
    'externalId',
    'createdAt',
  ],
};

export const proposalWriteSchema: JSONSchemaType<ProposalWrite> = {
  type: 'object',
  properties: {
    applicantId: {
      type: 'integer',
    },
    opportunityId: {
      type: 'integer',
    },
    externalId: {
      type: 'string',
      pattern: '.+',
    },
  },
  required: [
    'applicantId',
    'opportunityId',
    'externalId',
  ],
};

export const proposalRowWithFieldsAndValuesSchema:
JSONSchemaType<ProposalRowWithFieldsAndValues> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    applicantId: {
      type: 'integer',
    },
    opportunityId: {
      type: 'integer',
    },
    externalId: {
      type: 'string',
      pattern: '.+',
    },
    createdAt: {
      type: 'object',
      required: [],
      instanceof: 'Date',
    },
    proposalVersionId: {
      type: 'integer',
      nullable: true,
    },
    proposalVersionApplicationFormId: {
      type: 'integer',
      nullable: true,
    },
    proposalVersionVersion: {
      type: 'integer',
      nullable: true,
    },
    proposalVersionCreatedAt: {
      type: 'object',
      required: [],
      nullable: true,
      instanceof: 'Date',
    },
    proposalFieldValueId: {
      type: 'integer',
      nullable: true,
    },
    proposalFieldValueApplicationFormFieldId: {
      type: 'integer',
      nullable: true,
    },
    proposalFieldValueValue: {
      type: 'string',
      nullable: true,
    },
    proposalFieldValuePosition: {
      type: 'integer',
      nullable: true,
    },
    proposalFieldValueCreatedAt: {
      type: 'object',
      required: [],
      nullable: true,
      instanceof: 'Date',
    },
    applicationFormFieldCanonicalFieldId: {
      type: 'integer',
      nullable: true,
    },
    applicationFormFieldPosition: {
      type: 'integer',
      nullable: true,
    },
    applicationFormFieldLabel: {
      type: 'string',
      nullable: true,
    },
    applicationFormFieldCreatedAt: {
      type: 'object',
      required: [],
      nullable: true,
      instanceof: 'Date',
    },
  },
  required: [
    'id',
    'applicantId',
    'opportunityId',
    'externalId',
    'createdAt',
  ],
};

const proposalArraySchema: JSONSchemaType<Proposal[]> = {
  type: 'array',
  items: proposalSchema,
};

const proposalRowWithFieldsAndValuesArraySchema:
JSONSchemaType<ProposalRowWithFieldsAndValues[]> = {
  type: 'array',
  items: proposalRowWithFieldsAndValuesSchema,
};

export const isProposal = ajv.compile(proposalSchema);

export const isProposalWrite = ajv.compile(proposalWriteSchema);

export const isProposalArray = ajv.compile(proposalArraySchema);

export const isProposalRowWithFieldsAndValues = ajv.compile(
  proposalRowWithFieldsAndValuesSchema,
);

export const isProposalRowWithFieldsAndValuesArray = ajv.compile(
  proposalRowWithFieldsAndValuesArraySchema,
);
