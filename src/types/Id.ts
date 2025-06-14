import { ajv } from '../ajv';
import { MAX_UINT32 } from '../constants';
import type { JSONSchemaType } from 'ajv';

const MAXIMUM_VALID_ID = MAX_UINT32;
const MINIMUM_VALID_ID = 1;

export type Id = number;

export const idSchema: JSONSchemaType<Id> = {
	type: 'integer',
	minimum: MINIMUM_VALID_ID,
	maximum: MAXIMUM_VALID_ID,
};

export const isId = ajv.compile(idSchema);
