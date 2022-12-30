import { ajv } from '../ajv';
import { applicationFormFieldSchema } from './ApplicationFormField';
import type { JSONSchemaType } from 'ajv';
import type { ApplicationFormField } from './ApplicationFormField';

export interface ProposalFieldValue {
  readonly id: number;
  proposalVersionId: number;
  applicationFormFieldId: number;
  position: number;
  value: string;
  readonly createdAt: Date;
  readonly applicationFormField?: ApplicationFormField | null;
}

// See https://github.com/typescript-eslint/typescript-eslint/issues/1824
/* eslint-disable @typescript-eslint/indent */
export type ProposalFieldValueWrite = Omit<ProposalFieldValue, 'applicationFormField' | 'createdAt' | 'id' | 'proposalVersionId'>;
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
    position: {
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
    applicationFormField: {
      type: 'object',
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      properties: applicationFormFieldSchema.properties,
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      required: [],
      nullable: true,
    },
  },
  required: [
    'id',
    'proposalVersionId',
    'applicationFormFieldId',
    'position',
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
    position: {
      type: 'integer',
    },
    value: {
      type: 'string',
    },
  },
  required: [
    'applicationFormFieldId',
    'position',
    'value',
  ],
};

const proposalFieldValueArraySchema: JSONSchemaType<ProposalFieldValue[]> = {
  type: 'array',
  items: proposalFieldValueSchema,
};

export const isProposalFieldValue = ajv.compile(proposalFieldValueSchema);

export const isProposalFieldValueArray = ajv.compile(proposalFieldValueArraySchema);
