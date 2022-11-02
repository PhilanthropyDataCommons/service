import { ajv } from '../ajv';
import { proposalVersionSchema } from './ProposalVersion';
import type { JSONSchemaType } from 'ajv';
import type { ProposalVersion } from './ProposalVersion';

export interface Proposal {
  id: number;
  externalId: string;
  applicantId: number;
  opportunityId: number;
  versions?: ProposalVersion[];
  createdAt: Date;
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
    externalId: {
      type: 'string',
      pattern: '.+',
    },
    applicantId: {
      type: 'integer',
    },
    opportunityId: {
      type: 'integer',
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
    'externalId',
    'applicantId',
    'opportunityId',
    'createdAt',
  ],
};

export const proposalWriteSchema: JSONSchemaType<ProposalWrite> = {
  type: 'object',
  properties: {
    externalId: {
      type: 'string',
      pattern: '.+',
    },
    applicantId: {
      type: 'integer',
    },
    opportunityId: {
      type: 'integer',
    },
  },
  required: [
    'externalId',
    'applicantId',
    'opportunityId',
  ],
};

const proposalArraySchema: JSONSchemaType<Proposal[]> = {
  type: 'array',
  items: proposalSchema,
};

export const isProposal = ajv.compile(proposalSchema);

export const isProposalWrite = ajv.compile(proposalWriteSchema);

export const isProposalArray = ajv.compile(proposalArraySchema);
