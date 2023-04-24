import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

// The goal is to test an object is a valid JSON Schema (not against a schema, IS a schema).
// This is a temporary interface. There is likely a better JSON Schema interface from ajv.
export interface JsonSchemaObject {
  type: string;
  format?: string;
}

export const jsonSchemaObject: JSONSchemaType<JsonSchemaObject> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
    },
    format: {
      type: 'string',
      nullable: true,
    },
  },
  required: [
    'type',
  ],
};

export const isJsonSchemaObject = ajv.compile(jsonSchemaObject);
