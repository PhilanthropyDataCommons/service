import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface ApplicationForm {
  id: number;
  opportunityId: number;
  version: number;
  createdAt: Date;
}

export const applicationFormSchema: JSONSchemaType<ApplicationForm> = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
    },
    opportunityId: {
      type: 'integer',
    },
    version: {
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
    'opportunityId',
    'version',
    'createdAt',
  ],
};

export const isApplicationForm = ajv.compile(applicationFormSchema);

const applicationFormArraySchema: JSONSchemaType<ApplicationForm[]> = {
  type: 'array',
  items: applicationFormSchema,
};

export const isApplicationFormArray = ajv.compile(applicationFormArraySchema);
