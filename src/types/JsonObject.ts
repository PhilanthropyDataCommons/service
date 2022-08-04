import type { JsonObject } from 'swagger-ui-express';

export const isJsonObject = (obj: unknown): obj is JsonObject => (
  typeof obj === 'object'
);
