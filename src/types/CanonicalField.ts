import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface CanonicalField {
  id: number;
  label: string;
  shortCode: string;
  dataType: string;
  createdAt: Date;
}

export const canonicalFieldSchema: JSONSchemaType<CanonicalField> = {
  $id: 'philanthropydatacommons/jsonschema/canonicalField',
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
    dataType: {
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
    'label',
    'shortCode',
    'dataType',
    'createdAt',
  ],
};

export const isCanonicalField = ajv.compile(canonicalFieldSchema);

const canonicalFieldArraySchema: JSONSchemaType<CanonicalField[]> = {
  $id: 'philanthropydatacommons/jsonschema/canonicalFieldArray',
  type: 'array',
  items: canonicalFieldSchema,
};

export const isCanonicalFieldArray = ajv.compile(canonicalFieldArraySchema);
