import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export type Lanuage = string;

export const langaugeSchema: JSONSchemaType<Lanuage> = {
	type: 'string',
	isValidLanguageTag: true,
};

export const isValidLanguageTag = ajv.compile(langaugeSchema);
