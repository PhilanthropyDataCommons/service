import { ajv } from '../ajv';
import {
  proposalFieldValueSchema,
  proposalFieldValueWriteSchema,
} from './ProposalFieldValue';
import type { JSONSchemaType } from 'ajv';
import type {
  ProposalFieldValue,
  ProposalFieldValueWrite,
} from './ProposalFieldValue';

export interface ProposalVersion {
  id: number;
  proposalId: number;
  applicationFormId: number;
  version: number;
  fieldValues?: ProposalFieldValue[];
  createdAt: Date;
}

// See https://github.com/typescript-eslint/typescript-eslint/issues/1824
/* eslint-disable @typescript-eslint/indent */
export type ProposalVersionWrite = Omit<ProposalVersion, 'createdAt' | 'fieldValues' | 'id' | 'version'>
  & { fieldValues: ProposalFieldValueWrite[] };
/* eslint-enable @typescript-eslint/indent */

export const proposalVersionSchema: JSONSchemaType<ProposalVersion> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    proposalId: {
      type: 'integer',
    },
    applicationFormId: {
      type: 'integer',
    },
    version: {
      type: 'integer',
    },
    fieldValues: {
      type: 'array',
      items: proposalFieldValueSchema,
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
    'proposalId',
    'applicationFormId',
    'version',
    'createdAt',
  ],
};

export const proposalVersionWriteSchema: JSONSchemaType<ProposalVersionWrite> = {
  type: 'object',
  properties: {
    proposalId: {
      type: 'integer',
    },
    applicationFormId: {
      type: 'integer',
    },
    fieldValues: {
      type: 'array',
      items: proposalFieldValueWriteSchema,
    },
  },
  required: [
    'proposalId',
    'applicationFormId',
    'fieldValues',
  ],
};

const proposalVersionArraySchema: JSONSchemaType<ProposalVersion[]> = {
  type: 'array',
  items: proposalVersionSchema,
};

export const isProposalVersion = ajv.compile(proposalVersionSchema);

export const isProposalVersionWrite = ajv.compile(proposalVersionWriteSchema);

export const isProposalVersionArray = ajv.compile(proposalVersionArraySchema);
