import nock from 'nock';
import { InternalValidationError, UnauthorizedError } from '../../errors';
import { fetchKeycloakOrganizationMembers } from '../fetchOrganizationMembers';
import { KEYCLOAK_RESOURCE_LIST_PAGE_SIZE } from '../fetchPaginatedKeycloakResource';
import { stringToKeycloakId } from '../../types';
import type { KeycloakOrganizationMemberRepresentation } from '../fetchOrganizationMembers';

jest.mock('require-env-variable', () => ({
	requireEnv: () => ({
		AUTH_SERVER_ISSUER: 'https://keycloak.example.com/realms/test-realm',
	}),
}));

const AUTHORIZATION_HEADER = 'Bearer some.test.jwt';
const ORGANIZATION_KEYCLOAK_ID = stringToKeycloakId(
	'0b57f3e9-5c60-4a31-9d33-1f2b3c4d5e6f',
);
const MEMBERS_PATH =
	'/admin/realms/test-realm/organizations/0b57f3e9-5c60-4a31-9d33-1f2b3c4d5e6f/members';

const createKeycloakOrganizationMemberRepresentation = (index: number) => ({
	id: `00000000-0000-4000-9000-${String(index).padStart(12, '0')}`,
	firstName: `First${index}`,
	lastName: `Last${index}`,
	enabled: true,
});

const createMemberPage = (offset: number, count: number) =>
	Array.from({ length: count }, (_unused, index) =>
		createKeycloakOrganizationMemberRepresentation(offset + index),
	);

const collectListedMembers = async (
	pages: AsyncGenerator<
		{
			members: KeycloakOrganizationMemberRepresentation[];
			receivedAt: Date;
		},
		void,
		unknown
	>,
): Promise<KeycloakOrganizationMemberRepresentation[]> => {
	const members: KeycloakOrganizationMemberRepresentation[] = [];
	for await (const { members: pageMembers } of pages) {
		members.push(...pageMembers);
	}
	return members;
};

describe('fetchKeycloakOrganizationMembers', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	it('yields every member from a single page that is smaller than the page size', async () => {
		nock('https://keycloak.example.com')
			.get(MEMBERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, createMemberPage(0, 3));

		const members = await collectListedMembers(
			fetchKeycloakOrganizationMembers(
				AUTHORIZATION_HEADER,
				ORGANIZATION_KEYCLOAK_ID,
			),
		);

		expect(members).toEqual(createMemberPage(0, 3));
	});

	it('yields nothing for an organization without members', async () => {
		nock('https://keycloak.example.com')
			.get(MEMBERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, []);

		const members = await collectListedMembers(
			fetchKeycloakOrganizationMembers(
				AUTHORIZATION_HEADER,
				ORGANIZATION_KEYCLOAK_ID,
			),
		);

		expect(members).toEqual([]);
	});

	it('lists paginated results across multiple pages', async () => {
		nock('https://keycloak.example.com')
			.get(MEMBERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, createMemberPage(0, KEYCLOAK_RESOURCE_LIST_PAGE_SIZE));
		nock('https://keycloak.example.com')
			.get(MEMBERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, createMemberPage(KEYCLOAK_RESOURCE_LIST_PAGE_SIZE, 13));

		const members = await collectListedMembers(
			fetchKeycloakOrganizationMembers(
				AUTHORIZATION_HEADER,
				ORGANIZATION_KEYCLOAK_ID,
			),
		);

		expect(members).toEqual(
			createMemberPage(0, KEYCLOAK_RESOURCE_LIST_PAGE_SIZE + 13),
		);
	});

	it('rejects a malformed member list from Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get(MEMBERS_PATH)
			.query(true)
			.reply(200, [{ id: 'this is not a uuid' }]);

		await expect(
			collectListedMembers(
				fetchKeycloakOrganizationMembers(
					AUTHORIZATION_HEADER,
					ORGANIZATION_KEYCLOAK_ID,
				),
			),
		).rejects.toThrow(InternalValidationError);
	});

	it('propagates authorization failures from Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get(MEMBERS_PATH)
			.query(true)
			.reply(401, { error: 'HTTP 401 Unauthorized' });

		await expect(
			collectListedMembers(
				fetchKeycloakOrganizationMembers(
					AUTHORIZATION_HEADER,
					ORGANIZATION_KEYCLOAK_ID,
				),
			),
		).rejects.toThrow(UnauthorizedError);
	});

	it('aborts when consecutive pages make no progress', async () => {
		const page = createMemberPage(0, KEYCLOAK_RESOURCE_LIST_PAGE_SIZE);
		nock('https://keycloak.example.com')
			.get(MEMBERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, page);
		nock('https://keycloak.example.com')
			.get(MEMBERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, page);

		await expect(
			collectListedMembers(
				fetchKeycloakOrganizationMembers(
					AUTHORIZATION_HEADER,
					ORGANIZATION_KEYCLOAK_ID,
				),
			),
		).rejects.toThrow(InternalValidationError);
	});
});
