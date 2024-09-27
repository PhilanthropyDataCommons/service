import { Newtype, iso as createNewtypeIsomorphism } from 'newtype-ts';
import { InternalValidationError } from '../errors';
import { ajv } from '../ajv';
import { isUuid, uuidSchema } from './Uuid';
import type { Uuid } from './Uuid';
import type { JSONSchemaType } from 'ajv';

interface KeycloakUserId
	extends Newtype<{ readonly KeycloakUserId: unique symbol }, Uuid> {}

const keycloakUserIdIsomorphism = createNewtypeIsomorphism<KeycloakUserId>();

const keycloakUserIdSchema = uuidSchema as JSONSchemaType<KeycloakUserId>;

const isKeycloakUserId = ajv.compile(keycloakUserIdSchema);

const stringToKeycloakUserId = (s: string): KeycloakUserId => {
	if (!isUuid(s)) {
		throw new InternalValidationError(
			'KeycloakUserId must be a uuid',
			isUuid.errors ?? [],
		);
	}
	return keycloakUserIdIsomorphism.wrap(s);
};

const keycloakUserIdToString = (keycloakUserId: KeycloakUserId): string =>
	keycloakUserIdIsomorphism.unwrap(keycloakUserId);

export {
	isKeycloakUserId,
	KeycloakUserId,
	keycloakUserIdSchema,
	stringToKeycloakUserId,
	keycloakUserIdToString,
};
