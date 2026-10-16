import { ajv } from '../ajv';
import { isEmpty } from '../arrays';
import { InternalValidationError } from '../errors';
import { keycloakIdSchema, keycloakIdToString } from '../types';
import { keycloakAdminFetch } from './adminClient';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakId } from '../types';

const USERS_LIST_PAGE_SIZE = 100;

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

/**
 * Walks the entire realm's user list via the Keycloak Admin REST API using
 * the provided authorization header, one page at a time with
 * `briefRepresentation=true`. Brief representation is sufficient for
 * existence/identity sync and avoids per-user sub-requests (no N+1).
 */
const listKeycloakUsers = async (
	authorizationHeader: string,
): Promise<KeycloakUserRepresentation[]> => {
	const users: KeycloakUserRepresentation[] = [];
	let first = 0;
	let hasMorePages = true;
	let previousPageKey: string | null = null;
	while (hasMorePages) {
		// Pagination pages must be fetched sequentially: each request's `first`
		// offset depends on the previous page's size.
		// eslint-disable-next-line no-await-in-loop -- sequential pagination
		const response = await keycloakAdminFetch(
			authorizationHeader,
			`/users?briefRepresentation=true&first=${first}&max=${USERS_LIST_PAGE_SIZE}`,
		);
		// eslint-disable-next-line no-await-in-loop -- sequential pagination
		const payload: unknown = await response.json();
		if (!isKeycloakUsersPage(payload)) {
			throw new InternalValidationError(
				'Keycloak Admin API returned a malformed user list.',
				isKeycloakUsersPage.errors ?? [],
			);
		}
		// If two consecutive pages hold the same users, `first` is not being
		// honored and the walk would loop forever; abort instead.
		const pageKey = payload
			.map((user) => keycloakIdToString(user.id))
			.join(',');
		if (!isEmpty(payload) && pageKey === previousPageKey) {
			throw new InternalValidationError(
				'The Keycloak user list walk made no progress between pages; aborting to avoid an endless walk.',
				[],
			);
		}
		previousPageKey = pageKey;
		users.push(...payload);
		hasMorePages = payload.length === USERS_LIST_PAGE_SIZE;
		first += USERS_LIST_PAGE_SIZE;
	}
	return users;
};

export { listKeycloakUsers };
export type { KeycloakUserRepresentation };
