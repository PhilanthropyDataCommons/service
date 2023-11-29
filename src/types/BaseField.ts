import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface BaseField {
  id: number;
  label: string;
  shortCode: string;
  dataType: string;
  createdAt: Date;
}

// See https://github.com/typescript-eslint/typescript-eslint/issues/1824
/* eslint-disable @typescript-eslint/indent */
export type BaseFieldCreate = Omit<BaseField, 'createdAt' | 'id'>;
/* eslint-enable @typescript-eslint/indent */

export const baseFieldCreateSchema: JSONSchemaType<BaseFieldCreate> = {
  type: 'object',
  properties: {
    label: {
      type: 'string',
    },
    shortCode: {
      type: 'string',
    },
    dataType: {
      type: 'string',
    },
  },
  required: [
    'label',
    'shortCode',
    'dataType',
  ],
};

export const isBaseFieldCreate = ajv.compile(baseFieldCreateSchema);
