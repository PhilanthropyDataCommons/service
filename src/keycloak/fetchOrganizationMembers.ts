import { ajv } from '../ajv';
import { keycloakIdSchema, nonNullKeycloakIdToString } from '../types';
import {
	KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
	fetchPaginatedKeycloakResource,
} from './fetchPaginatedKeycloakResource';
import type { JSONSchemaType } from 'ajv';
import type { KeycloakId } from '../types';

interface KeycloakOrganizationMemberRepresentation {
	id: KeycloakId;
	firstName?: string | null;
	lastName?: string | null;
	enabled: boolean;
}

const keycloakOrganizationMemberRepresentationSchema: JSONSchemaType<KeycloakOrganizationMemberRepresentation> =
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

const keycloakOrganizationMembersPageSchema: JSONSchemaType<
	KeycloakOrganizationMemberRepresentation[]
> = {
	type: 'array',
	items: keycloakOrganizationMemberRepresentationSchema,
};

const isKeycloakOrganizationMembersPage = ajv.compile(
	keycloakOrganizationMembersPageSchema,
);

const fetchKeycloakOrganizationMembers = async function* (
	authorizationHeader: string,
	organizationKeycloakId: KeycloakId,
	deadlineSignal?: AbortSignal,
): AsyncGenerator<
	{
		members: KeycloakOrganizationMemberRepresentation[];
		receivedAt: Date;
	},
	void,
	unknown
> {
	const pages = fetchPaginatedKeycloakResource(
		authorizationHeader,
		deadlineSignal,
		{
			pageSize: KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
			buildPageUrl: (first, pageSize) =>
				`/organizations/${nonNullKeycloakIdToString(organizationKeycloakId)}/members?briefRepresentation=true&first=${first}&max=${pageSize}`,
			isPage: isKeycloakOrganizationMembersPage,
			errorNoun: 'organization member',
		},
	);
	for await (const { items: members, receivedAt } of pages) {
		yield { members, receivedAt };
	}
};

export { fetchKeycloakOrganizationMembers };
export type { KeycloakOrganizationMemberRepresentation };
