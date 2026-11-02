import { ajv } from '../ajv';
import { keycloakIdSchema } from '../types';
import {
	KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
	fetchPaginatedKeycloakResource,
} from './fetchPaginatedKeycloakResource';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakId } from '../types';

interface KeycloakOrganizationRepresentation {
	id: KeycloakId;
	name?: string | null;
	enabled: boolean;
}

const keycloakOrganizationRepresentationSchema: JSONSchemaType<KeycloakOrganizationRepresentation> =
	{
		type: 'object',
		properties: {
			id: keycloakIdSchema,
			name: {
				type: 'string',
				nullable: true,
			},
			enabled: {
				type: 'boolean',
			},
		},
		required: ['id', 'enabled'],
	};

const keycloakOrganizationsPageSchema: JSONSchemaType<
	KeycloakOrganizationRepresentation[]
> = {
	type: 'array',
	items: keycloakOrganizationRepresentationSchema,
};

const isKeycloakOrganizationsPage = ajv.compile(
	keycloakOrganizationsPageSchema,
);

const fetchKeycloakOrganizations = async function* (
	authorizationHeader: string,
	deadlineSignal?: AbortSignal,
): AsyncGenerator<
	{ organizations: KeycloakOrganizationRepresentation[]; receivedAt: Date },
	void,
	unknown
> {
	const pages = fetchPaginatedKeycloakResource(
		authorizationHeader,
		deadlineSignal,
		{
			pageSize: KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
			buildPageUrl: (first, pageSize) =>
				`/organizations?briefRepresentation=true&first=${first}&max=${pageSize}`,
			isPage: isKeycloakOrganizationsPage,
			errorNoun: 'organization',
		},
	);
	for await (const { items: organizations, receivedAt } of pages) {
		yield { organizations, receivedAt };
	}
};

export { fetchKeycloakOrganizations };
export type { KeycloakOrganizationRepresentation };
