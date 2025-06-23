import { iso as createNewtypeIsomorphism } from 'newtype-ts';
import { InternalValidationError } from '../errors';
import { ajv } from '../ajv';
import { isUuid, uuidSchema } from './Uuid';
import type { Newtype } from 'newtype-ts';
import type { Uuid } from './Uuid';
import type { JSONSchemaType } from 'ajv';

type KeycloakId = Newtype<{ readonly KeycloakId: unique symbol }, Uuid>;

const keycloakIdIsomorphism = createNewtypeIsomorphism<KeycloakId>();

/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
 * JSONSchemaType is trying to take the Newytype (KeycloakId) at face value,
 * including the phantom attributes that make a Newtype what it is.
 * This is not accurate / does not reflect runtime values (kecloakIds are uuids)
 * and so we need to make this otherwise unsafe cast.
 */
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

const keycloakIdToString = (
	keycloakId: KeycloakId | null | undefined,
): string | null =>
	keycloakId === null || keycloakId === undefined
		? null
		: keycloakIdIsomorphism.unwrap(keycloakId);

// In a future version of TypeScript we hope to be able to benefit from conditional return types
// so that we can just have a single function which will, when passed null, return null and when passed
// a KeycloakId, return a string. For now, we have to have two functions.
// See: https://devblogs.microsoft.com/typescript/announcing-typescript-5-8-beta/#checked-returns-for-conditional-and-indexed-access-types
const nonNullKeycloakIdToString = (keycloakId: KeycloakId): string =>
	keycloakIdIsomorphism.unwrap(keycloakId);

export {
	isKeycloakId,
	type KeycloakId,
	keycloakIdSchema,
	stringToKeycloakId,
	keycloakIdToString,
	nonNullKeycloakIdToString,
};
