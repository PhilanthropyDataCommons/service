import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface BaseField {
  id: number;
  label: string;
  description: string;
  shortCode: string;
  dataType: string;
  createdAt: Date;
}

// See https://github.com/typescript-eslint/typescript-eslint/issues/1824
/* eslint-disable @typescript-eslint/indent */
export type BaseFieldWrite = Omit<BaseField, 'createdAt' | 'id'>;
/* eslint-enable @typescript-eslint/indent */

export const baseFieldWriteSchema: JSONSchemaType<BaseFieldWrite> = {
  type: 'object',
  properties: {
    label: {
      type: 'string',
    },
    description: {
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
    'description',
    'shortCode',
    'dataType',
  ],
};

export const isBaseFieldWrite = ajv.compile(baseFieldWriteSchema);
