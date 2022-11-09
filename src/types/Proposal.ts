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

const proposalArraySchema: JSONSchemaType<Proposal[]> = {
  type: 'array',
  items: proposalSchema,
};

export const isProposal = ajv.compile(proposalSchema);

export const isProposalWrite = ajv.compile(proposalWriteSchema);

export const isProposalArray = ajv.compile(proposalArraySchema);
