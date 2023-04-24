import { ajv } from '../ajv';
import { jsonSchemaObject } from './JsonSchemaObject';
import type { JsonSchemaObject } from './JsonSchemaObject';
import type { JSONSchemaType } from 'ajv';

export interface CanonicalField {
  id: number;
  label: string;
  shortCode: string;
  dataType: JsonSchemaObject;
  createdAt: Date;
}

export const canonicalFieldSchema: JSONSchemaType<CanonicalField> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    label: {
      type: 'string',
    },
    shortCode: {
      type: 'string',
    },
    dataType: jsonSchemaObject,
    createdAt: {
      type: 'object',
      required: [],
      instanceof: 'Date',
    },
  },
  required: [
    'id',
    'label',
    'shortCode',
    'dataType',
    'createdAt',
  ],
};

export const isCanonicalField = ajv.compile(canonicalFieldSchema);

const canonicalFieldArraySchema: JSONSchemaType<CanonicalField[]> = {
  type: 'array',
  items: canonicalFieldSchema,
};

export const isCanonicalFieldArray = ajv.compile(canonicalFieldArraySchema);
