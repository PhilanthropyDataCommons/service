import { isEmpty, isNotEmpty } from '../arrays';
import { FOUR_HOURS_IN_MS } from '../constants';
import { InternalValidationError, KeycloakAdminApiError } from '../errors';
import { nonNullKeycloakIdToString } from '../types';
import {
	KEYCLOAK_REQUEST_TIMEOUT,
	fetchKeycloakResourceAsKeycloakAdmin,
} from './adminClient';
import type { ValidateFunction } from 'ajv';
import type { KeycloakId } from '../types';

const KEYCLOAK_RESOURCE_LIST_PAGE_SIZE = 5000;
const KEYCLOAK_PAGINATION_MAX_DURATION_IN_MS = FOUR_HOURS_IN_MS;

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

export interface KeycloakResourcePage<T> {
	items: T[];
	receivedAt: Date;
}

const fetchPaginatedKeycloakResource = async function* <
	T extends { id: KeycloakId },
>(
	authorizationHeader: string,
	deadlineSignal: AbortSignal = AbortSignal.timeout(
		KEYCLOAK_PAGINATION_MAX_DURATION_IN_MS,
	),
	options: {
		pageSize: number;
		buildPageUrl: (first: number, pageSize: number) => string;
		isPage: ValidateFunction<T[]>;
		errorNoun: string;
	},
): AsyncGenerator<KeycloakResourcePage<T>, void, unknown> {
	const seenIds = new Set<string>();
	let first = 0;
	let previousPageKey: string | null = null;
	let hasMorePages = true;
	/* eslint-disable no-await-in-loop -- each call depends on the previous call's result */
	while (hasMorePages) {
		const { response, receivedAt } = await fetchKeycloakResourceAsKeycloakAdmin(
			authorizationHeader,
			options.buildPageUrl(first, options.pageSize),
			AbortSignal.any([
				deadlineSignal,
				AbortSignal.timeout(KEYCLOAK_REQUEST_TIMEOUT),
			]),
		);
		const payload: unknown = await resolveKeycloakJsonResponse(response);
		if (!options.isPage(payload)) {
			throw new InternalValidationError(
				`Keycloak Admin API returned a malformed ${options.errorNoun} list.`,
				options.isPage.errors ?? [],
			);
		}
		const pageKey = payload
			.map((item) => nonNullKeycloakIdToString(item.id))
			.join(',');
		if (!isEmpty(payload) && pageKey === previousPageKey) {
			throw new InternalValidationError(
				`The Keycloak ${options.errorNoun} listing made no progress between pages; aborting to avoid an endless loop.`,
				[],
			);
		}
		previousPageKey = pageKey;
		const newItems = payload.filter((item) => {
			const itemId = nonNullKeycloakIdToString(item.id);
			if (seenIds.has(itemId)) {
				return false;
			}
			seenIds.add(itemId);
			return true;
		});
		if (isNotEmpty(newItems)) {
			yield { items: newItems, receivedAt };
		}
		hasMorePages = payload.length === KEYCLOAK_RESOURCE_LIST_PAGE_SIZE;
		first += KEYCLOAK_RESOURCE_LIST_PAGE_SIZE;
	}
	/* eslint-enable no-await-in-loop */
};

export { KEYCLOAK_RESOURCE_LIST_PAGE_SIZE, fetchPaginatedKeycloakResource };
