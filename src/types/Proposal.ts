import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface Proposal {
  id: number;
  externalId: string;
  applicantId: number;
  opportunityId: number;
  createdAt: Date;
}

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

export const isProposal = ajv.compile(proposalSchema);

const proposalArraySchema: JSONSchemaType<Proposal[]> = {
  type: 'array',
  items: proposalSchema,
};

export const isProposalArray = ajv.compile(proposalArraySchema);
