import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface ProposalFieldValue {
  id: number;
  proposalVersionId: number;
  applicationFormFieldId: number;
  sequence: number;
  value: string;
  createdAt: Date;
}

// See https://github.com/typescript-eslint/typescript-eslint/issues/1824
/* eslint-disable @typescript-eslint/indent */
export type ProposalFieldValueWrite = Omit<ProposalFieldValue, 'createdAt' | 'id' | 'proposalVersionId'>;
/* eslint-enable @typescript-eslint/indent */

export const proposalFieldValueSchema: JSONSchemaType<ProposalFieldValue> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    proposalVersionId: {
      type: 'integer',
    },
    applicationFormFieldId: {
      type: 'integer',
    },
    sequence: {
      type: 'integer',
    },
    value: {
      type: 'string',
    },
    createdAt: {
      type: 'object',
      required: [],
      instanceof: 'Date',
    },
  },
  required: [
    'id',
    'proposalVersionId',
    'applicationFormFieldId',
    'sequence',
    'value',
    'createdAt',
  ],
};

export const proposalFieldValueWriteSchema: JSONSchemaType<ProposalFieldValueWrite> = {
  type: 'object',
  properties: {
    applicationFormFieldId: {
      type: 'integer',
    },
    sequence: {
      type: 'integer',
    },
    value: {
      type: 'string',
    },
  },
  required: [
    'applicationFormFieldId',
    'sequence',
    'value',
  ],
};

const proposalFieldValueArraySchema: JSONSchemaType<ProposalFieldValue[]> = {
  type: 'array',
  items: proposalFieldValueSchema,
};

export const isProposalFieldValue = ajv.compile(proposalFieldValueSchema);

export const isProposalFieldValueArray = ajv.compile(proposalFieldValueArraySchema);
