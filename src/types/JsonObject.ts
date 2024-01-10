import { ajv } from '../ajv';
import type { JsonObject } from 'swagger-ui-express';
import type { JSONSchemaType } from 'ajv';

const jsonObjectSchema: JSONSchemaType<JsonObject> = {
	type: 'object',
	properties: {},
	required: [],
};
export const isJsonObject = ajv.compile(jsonObjectSchema);
