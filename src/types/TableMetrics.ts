import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface TableMetrics {
  count: number;
  maxId: number;
  now: Date;
}

export const tableMetricsSchema: JSONSchemaType<TableMetrics> = {
  type: 'object',
  properties: {
    count: {
      type: 'integer',
    },
    maxId: {
      type: 'integer',
    },
    now: {
      type: 'object',
      required: [],
      instanceof: 'Date',
    },
  },
  required: [
    'count',
    'maxId',
    'now',
  ],
};

export const isTableMetrics = ajv.compile(tableMetricsSchema);
