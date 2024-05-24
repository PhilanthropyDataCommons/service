import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export type Id = number;

export const idSchema: JSONSchemaType<Id> = {
	type: 'integer',
	minimum: 1,
	maximum: 4294967295,
};

export const isId = ajv.compile(idSchema);
