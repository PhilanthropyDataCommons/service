import { ajv } from '../ajv';
import { keycloakIdSchema } from '../types';
import {
	KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
	fetchPaginatedKeycloakResource,
} from './fetchPaginatedKeycloakResource';
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

const fetchKeycloakUsers = async function* (
	authorizationHeader: string,
	deadlineSignal?: AbortSignal,
): AsyncGenerator<
	{ users: KeycloakUserRepresentation[]; receivedAt: Date },
	void,
	unknown
> {
	const pages = fetchPaginatedKeycloakResource(
		authorizationHeader,
		deadlineSignal,
		{
			pageSize: KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
			buildPageUrl: (first, pageSize) =>
				`/users?briefRepresentation=true&exact=false&first=${first}&max=${pageSize}`,
			isPage: isKeycloakUsersPage,
			errorNoun: 'user',
		},
	);
	for await (const { items: users, receivedAt } of pages) {
		yield { users, receivedAt };
	}
};

export { fetchKeycloakUsers };
export type { KeycloakUserRepresentation };
