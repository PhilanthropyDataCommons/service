import { ajv } from '../ajv';
import { MAX_INT32 } from '../constants';
import type { JSONSchemaType } from 'ajv';

export type Id = number;

export const idSchema: JSONSchemaType<Id> = {
	type: 'integer',
	minimum: 1,
	maximum: MAX_INT32,
};

export const isId = ajv.compile(idSchema);
