import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

// This type is defined to fill a type void in the tinypg library
// See: https://github.com/dynajoe/tinypg/issues/40
export interface QueryContextWithError {
  error: {
    length: number;
    name: string;
    severity: string;
    code: string;
    detail: string;
    schema: string;
    table: string;
    constraint: string;
    file: string;
    line: string;
    routine: string;
  };
}

export const queryContextWithErrorSchema: JSONSchemaType<QueryContextWithError> = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        length: {
          type: 'number',
        },
        name: {
          type: 'string',
        },
        severity: {
          type: 'string',
        },
        code: {
          type: 'string',
        },
        detail: {
          type: 'string',
        },
        schema: {
          type: 'string',
        },
        table: {
          type: 'string',
        },
        constraint: {
          type: 'string',
        },
        file: {
          type: 'string',
        },
        line: {
          type: 'string',
        },
        routine: {
          type: 'string',
        },
      },
      required: [
        'length',
        'name',
        'severity',
        'code',
        'detail',
        'schema',
        'table',
        'constraint',
        'file',
        'line',
        'routine',
      ],
    },
  },
  required: [
    'error',
  ],
};

export const isQueryContextWithError = ajv.compile(queryContextWithErrorSchema);
