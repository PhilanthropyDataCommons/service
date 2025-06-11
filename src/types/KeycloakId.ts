import { Newtype, iso as createNewtypeIsomorphism } from 'newtype-ts';
import { InternalValidationError } from '../errors';
import { ajv } from '../ajv';
import { isUuid, uuidSchema } from './Uuid';
import type { Uuid } from './Uuid';
import type { JSONSchemaType } from 'ajv';

type KeycloakId = Newtype<{ readonly KeycloakId: unique symbol }, Uuid>;

const keycloakIdIsomorphism = createNewtypeIsomorphism<KeycloakId>();

const keycloakIdSchema = uuidSchema as JSONSchemaType<KeycloakId>;

const isKeycloakId = ajv.compile(keycloakIdSchema);

const stringToKeycloakId = (s: string): KeycloakId => {
	if (!isUuid(s)) {
		throw new InternalValidationError(
			'KeycloakId must be a uuid',
			isUuid.errors ?? [],
		);
	}
	return keycloakIdIsomorphism.wrap(s);
};

const keycloakIdToString = (keycloakId: KeycloakId): string =>
	keycloakIdIsomorphism.unwrap(keycloakId);

export {
	isKeycloakId,
	type KeycloakId,
	keycloakIdSchema,
	stringToKeycloakId,
	keycloakIdToString,
};
