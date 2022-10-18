import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface Opportunity {
  id: number;
  title: string;
  createdAt: Date;
}

export const opportunitySchema: JSONSchemaType<Opportunity> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    title: {
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
    'title',
    'createdAt',
  ],
};

export const isOpportunity = ajv.compile(opportunitySchema);

const opportunityArraySchema: JSONSchemaType<Opportunity[]> = {
  type: 'array',
  items: opportunitySchema,
};

export const isOpportunityArray = ajv.compile(opportunityArraySchema);
