import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

// This is the closest native TypeScript approximation of a UUID.
// The schema definition is more accurate / actually confirms the format.
type Uuid = `${string}-${string}-${string}-${string}-${string}`;

const uuidSchema = {
	type: 'string',
	format: 'uuid',
} as JSONSchemaType<Uuid>;

const isUuid = ajv.compile(uuidSchema);

export { Uuid, uuidSchema, isUuid };
