import { ajv } from '../ajv';
import { isEmpty } from '../arrays';
import { InternalValidationError, KeycloakAdminApiError } from '../errors';
import { keycloakIdSchema, keycloakIdToString } from '../types';
import {
	KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS,
	KEYCLOAK_USER_LISTING_MAX_DURATION_IN_MS,
	KEYCLOAK_USERS_LIST_PAGE_SIZE,
} from './constants';
import { keycloakAdminFetch } from './adminClient';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakId } from '../types';

interface KeycloakUserRepresentation {
	id: KeycloakId;
	// We do not really want "undefined" here, only null. See
	// https://github.com/ajv-validator/ajv/issues/2283 and/or
	// https://github.com/ajv-validator/ajv/issues/2163.
	firstName?: string | null;
	lastName?: string | null;
	enabled: boolean;
}

const keycloakUserRepresentationSchema: JSONSchemaType<KeycloakUserRepresentation> =
	{
		type: 'object',
		properties: {
			id: keycloakIdSchema,
			firstName: {
				type: 'string',
				nullable: true,
			},
			lastName: {
				type: 'string',
				nullable: true,
			},
			enabled: {
				type: 'boolean',
			},
		},
		required: ['id', 'enabled'],
	};

const keycloakUsersPageSchema: JSONSchemaType<KeycloakUserRepresentation[]> = {
	type: 'array',
	items: keycloakUserRepresentationSchema,
};

const isKeycloakUsersPage = ajv.compile(keycloakUsersPageSchema);

// Matched by name: undici's errors originate in another VM realm, where
// cross-realm instanceof fails.
const hasErrorName = (err: unknown, name: string): boolean =>
	typeof err === 'object' && err !== null && 'name' in err && err.name === name;

// Transport failures during the body read become KeycloakAdminApiError;
// anything else propagates.
const readUsersResponse = async (response: Response): Promise<unknown> => {
	try {
		return await response.json();
	} catch (err) {
		if (
			hasErrorName(err, 'SyntaxError') ||
			hasErrorName(err, 'TypeError') ||
			hasErrorName(err, 'AbortError') ||
			hasErrorName(err, 'TimeoutError')
		) {
			throw new KeycloakAdminApiError(
				'Failed to read the Keycloak Admin API response body.',
				{ cause: err },
			);
		}
		throw err;
	}
};

/**
 * Lists every user in the realm, one page at a time. Each page request
 * aborts after `KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS`, and the whole listing
 * after `KEYCLOAK_USER_LISTING_MAX_DURATION_IN_MS`.
 */
const fetchKeycloakUsers = async (
	authorizationHeader: string,
	deadlineSignal: AbortSignal = AbortSignal.timeout(
		KEYCLOAK_USER_LISTING_MAX_DURATION_IN_MS,
	),
): Promise<KeycloakUserRepresentation[]> => {
	const users: KeycloakUserRepresentation[] = [];
	let first = 0;
	let hasMorePages = true;
	let previousPageKey: string | null = null;
	while (hasMorePages) {
		// Pagination pages must be fetched sequentially: each request's `first`
		// offset depends on the previous page's size.
		// `exact=false` reaches Keycloak's filtering branch so service
		// accounts are listed; the unfiltered branch excludes them.
		const usersUrl = `/users?briefRepresentation=true&exact=false&first=${first}&max=${KEYCLOAK_USERS_LIST_PAGE_SIZE}`;
		// eslint-disable-next-line no-await-in-loop -- sequential pagination
		const response = await keycloakAdminFetch(
			authorizationHeader,
			usersUrl,
			AbortSignal.any([
				deadlineSignal,
				AbortSignal.timeout(KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS),
			]),
		);
		// eslint-disable-next-line no-await-in-loop -- sequential pagination
		const payload: unknown = await readUsersResponse(response);
		if (!isKeycloakUsersPage(payload)) {
			throw new InternalValidationError(
				'Keycloak Admin API returned a malformed user list.',
				isKeycloakUsersPage.errors ?? [],
			);
		}
		const pageKey = payload
			.map((user) => keycloakIdToString(user.id))
			.join(',');
		if (!isEmpty(payload) && pageKey === previousPageKey) {
			throw new InternalValidationError(
				'The Keycloak user listing made no progress between pages; aborting to avoid an endless loop.',
				[],
			);
		}
		previousPageKey = pageKey;
		users.push(...payload);
		hasMorePages = payload.length === KEYCLOAK_USERS_LIST_PAGE_SIZE;
		first += KEYCLOAK_USERS_LIST_PAGE_SIZE;
	}
	return users;
};

export { fetchKeycloakUsers };
export type { KeycloakUserRepresentation };
