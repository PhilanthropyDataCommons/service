import { ajv } from '../ajv';
import { getLogger } from '../logger';
import { applicationSchemaFieldSchema } from './ApplicationSchemaField';
import type { JSONSchemaType } from 'ajv';
import type { ApplicationSchemaField } from './ApplicationSchemaField';

const logger = getLogger(__filename);

export interface ApplicationSchema {
  id: number;
  // As of this commit, only one Application Schema version per Opportunity is
  // visible through the API even though multiple are supported by the DB.
  // Therefore it is be superfluous to expose it here or now. The latest schema
  // will be the one retrieved for a given opportunity while the schema used by
  // a particular application will be related to the schema used at the time.
  // Nevertheless, we will declare the maximal fields here as a rule and where
  // it is not needed a utility type can be defined instead, subtracting it.
  version: number;
  fields: ApplicationSchemaField[];
  createdAt: Date;
}

export const applicationSchemaSchema: JSONSchemaType<ApplicationSchema> = {
  $id: 'PhilanthropyDataCommons/JSONSchema/applicationSchema',
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    version: {
      // Technically this is a smallint.
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
    'version',
    'fields',
    'createdAt',
  ],
};

logger.debug(applicationSchemaSchema);

export const isApplicationSchemaSchema = ajv.compile(applicationSchemaSchema);
