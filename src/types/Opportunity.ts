import { ajv } from '../ajv';
import { applicationSchemaSchema } from './ApplicationSchema';
import type { JSONSchemaType } from 'ajv';
import type { ApplicationSchema } from './ApplicationSchema';

export interface Opportunity {
  id: number;
  title: string;
  applicationSchema: ApplicationSchema;
  createdAt: Date;
}

export const opportunitySchema: JSONSchemaType<Opportunity> = {
  $id: 'PhilanthropyDataCommons/JSONSchema/opportunity',
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    title: {
      type: 'string',
    },
    applicationSchema: applicationSchemaSchema,
    createdAt: {
      type: 'object',
      required: [],
      instanceof: 'Date',
    },
  },
  required: [
    'id',
    'title',
    'applicationSchema',
    'createdAt',
  ],
};

export const isOpportunity = ajv.compile(opportunitySchema);

const opportunityArraySchema: JSONSchemaType<Opportunity[]> = {
  $id: 'PhilanthropyDataCommons/JSONSchema/opportunityArray',
  type: 'array',
  items: opportunitySchema,
};

export const isOpportunityArraySchema = ajv.compile(opportunityArraySchema);
