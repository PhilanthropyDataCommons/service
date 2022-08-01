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
  // Strictly speaking we do not need to explicitly retrieve the position, we
  // can retrieve them in order and the position in the array indicates the
  // position. But we also show the position explicitly here. For writes the
  // position will be needed anyway.
  position: number;
  // Strictly speaking and practically speaking we do not need to repeat the
  // application schema id here, do we? It would only be used on writes.
  // The value is already represented in the ApplicationSchema, higher up in
  // the document structure.
  createdAt: Date;
}

export const applicationSchemaFieldSchema: JSONSchemaType<ApplicationSchemaField> = {
  $id: 'PhilanthropyDataCommons/JSONSchema/applicationSchemaField',
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    canonicalField: canonicalFieldSchema,
    label: {
      type: 'string',
    },
    position: {
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
    'canonicalField',
    'label',
    'position',
    'createdAt',
  ],
};

logger.debug(applicationSchemaFieldSchema);

export const isApplicationSchemaFieldSchema = ajv.compile(applicationSchemaFieldSchema);
