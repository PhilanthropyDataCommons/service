import { ajv } from '../ajv';
import { isEmpty, isNotEmpty } from '../arrays';
import { InternalValidationError, KeycloakAdminApiError } from '../errors';
import { keycloakIdSchema, nonNullKeycloakIdToString } from '../types';
import {
	KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS,
	KEYCLOAK_USER_LISTING_MAX_DURATION_IN_MS,
	KEYCLOAK_USERS_LIST_PAGE_SIZE,
} from './constants';
import { fetchKeycloakResourceAsKeycloakAdmin } from './adminClient';
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

const hasErrorName = (err: unknown, name: string): boolean =>
	typeof err === 'object' && err !== null && 'name' in err && err.name === name;

const resolveKeycloakJsonResponse = async (
	response: Response,
): Promise<unknown> => {
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

const fetchKeycloakUsers = async function* (
	authorizationHeader: string,
	deadlineSignal: AbortSignal = AbortSignal.timeout(
		KEYCLOAK_USER_LISTING_MAX_DURATION_IN_MS,
	),
): AsyncGenerator<
	{ users: KeycloakUserRepresentation[]; receivedAt: Date },
	void,
	unknown
> {
	const seenIds = new Set<string>();
	let first = 0;
	let hasMorePages = true;
	let previousPageKey: string | null = null;
	while (hasMorePages) {
		const usersUrlIncludingServiceAccounts = `/users?briefRepresentation=true&exact=false&first=${first}&max=${KEYCLOAK_USERS_LIST_PAGE_SIZE}`;
		/* eslint-disable no-await-in-loop -- each call depends on the previous call's result */
		const { response, receivedAt } = await fetchKeycloakResourceAsKeycloakAdmin(
			authorizationHeader,
			usersUrlIncludingServiceAccounts,
			AbortSignal.any([
				deadlineSignal,
				AbortSignal.timeout(KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS),
			]),
		);
		const payload: unknown = await resolveKeycloakJsonResponse(response);
		/* eslint-enable no-await-in-loop */
		if (!isKeycloakUsersPage(payload)) {
			throw new InternalValidationError(
				'Keycloak Admin API returned a malformed user list.',
				isKeycloakUsersPage.errors ?? [],
			);
		}
		const pageKey = payload
			.map((user) => nonNullKeycloakIdToString(user.id))
			.join(',');
		if (!isEmpty(payload) && pageKey === previousPageKey) {
			throw new InternalValidationError(
				'The Keycloak user listing made no progress between pages; aborting to avoid an endless loop.',
				[],
			);
		}
		previousPageKey = pageKey;
		const newUsers = payload.filter((user) => {
			const userId = nonNullKeycloakIdToString(user.id);
			if (seenIds.has(userId)) {
				return false;
			}
			seenIds.add(userId);
			return true;
		});
		if (isNotEmpty(newUsers)) {
			yield { users: newUsers, receivedAt };
		}
		hasMorePages = payload.length === KEYCLOAK_USERS_LIST_PAGE_SIZE;
		first += KEYCLOAK_USERS_LIST_PAGE_SIZE;
	}
};

export { fetchKeycloakUsers };
export type { KeycloakUserRepresentation };
