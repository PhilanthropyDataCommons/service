import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

// This type is defined to fill a type void in the tinypg library
// See: https://github.com/dynajoe/tinypg/issues/40
export interface TinyPgErrorWithQueryContext {
  name: string;
  message: string;
  queryContext: {
    error: {
      code: string;
    };
  };
}

export const tinyPgErrorWithQueryContextSchema: JSONSchemaType<TinyPgErrorWithQueryContext> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    message: {
      type: 'string',
    },
    queryContext: {
      type: 'object',
      properties: {
        error: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
            },
          },
          required: [
            'code',
          ],
        },
      },
      required: [
        'error',
      ],
    },
  },
  required: [
    'name',
    'message',
    'queryContext',
  ],
};

export const isTinyPgErrorWithQueryContext = ajv.compile(tinyPgErrorWithQueryContextSchema);
