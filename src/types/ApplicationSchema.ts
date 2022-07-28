import { ajv } from '../ajv';
import { getLogger } from '../logger';
import { applicationSchemaFieldSchema } from './ApplicationSchemaField';
import type { JSONSchemaType } from 'ajv';
import type { ApplicationSchemaField } from './ApplicationSchemaField';

const logger = getLogger(__filename);

export interface ApplicationSchema {
  id: number;
  fields: ApplicationSchemaField[];
  createdAt: Date;
}

export const applicationSchemaSchema: JSONSchemaType<ApplicationSchema> = {
  $id: 'https://pilot.philanthropydatacommons.org/schema/applicationSchema.json',
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    fields: {
      type: 'array',
      items: applicationSchemaFieldSchema,
    },
    createdAt: {
      type: 'object',
      required: [],
      instanceof: 'Date',
    },
  },
  required: [
    'id',
    'fields',
    'createdAt',
  ],
};

logger.debug(applicationSchemaSchema);

export const isApplicationSchemaSchema = ajv.compile(applicationSchemaSchema);
