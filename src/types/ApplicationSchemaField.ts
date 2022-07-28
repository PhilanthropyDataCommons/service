import { ajv } from '../ajv';
import { getLogger } from '../logger';
import { canonicalFieldSchema } from './CanonicalField';
import type { CanonicalField } from './CanonicalField';
import type { JSONSchemaType } from 'ajv';

const logger = getLogger(__filename);

export interface ApplicationSchemaField {
  id: number;
  canonicalField: CanonicalField;
  label: string;
  createdAt: Date;
}

export const applicationSchemaFieldSchema: JSONSchemaType<ApplicationSchemaField> = {
  $id: 'philanthropydatacommons/jsonschema/applicationSchemaField',
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    canonicalField: canonicalFieldSchema,
    label: {
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
    'canonicalField',
    'label',
    'createdAt',
  ],
};

logger.debug(applicationSchemaFieldSchema);

export const isApplicationSchemaFieldSchema = ajv.compile(applicationSchemaFieldSchema);
