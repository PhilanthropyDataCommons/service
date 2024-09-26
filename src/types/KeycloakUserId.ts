import type { JSONSchemaType } from 'ajv';

type KeycloakUserId = string;

const keycloakUserIdSchema: JSONSchemaType<KeycloakUserId> = {
	type: 'string',
	format: 'uuid',
};

export { KeycloakUserId, keycloakUserIdSchema };
