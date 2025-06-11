import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

type ShortCode = string;

const shortCodeSchema: JSONSchemaType<ShortCode> = {
	type: 'string',
	pattern: '^[\\w\\-]+$',
};

const isShortCode = ajv.compile(shortCodeSchema);

export { type ShortCode, shortCodeSchema, isShortCode };
