import nock from 'nock';
import { InternalValidationError, UnauthorizedError } from '../../errors';
import { fetchKeycloakOrganizations } from '../fetchOrganizations';
import { KEYCLOAK_RESOURCE_LIST_PAGE_SIZE } from '../fetchPaginatedKeycloakResource';
import type { KeycloakOrganizationRepresentation } from '../fetchOrganizations';

jest.mock('require-env-variable', () => ({
	requireEnv: () => ({
		AUTH_SERVER_ISSUER: 'https://keycloak.example.com/realms/test-realm',
	}),
}));

const AUTHORIZATION_HEADER = 'Bearer some.test.jwt';
const ORGANIZATIONS_PATH = '/admin/realms/test-realm/organizations';

const createKeycloakOrganizationRepresentation = (index: number) => ({
	id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
	name: `Organization ${index}`,
	enabled: true,
});

const createOrganizationPage = (offset: number, count: number) =>
	Array.from({ length: count }, (_unused, index) =>
		createKeycloakOrganizationRepresentation(offset + index),
	);

const collectListedOrganizations = async (
	pages: AsyncGenerator<
		{
			organizations: KeycloakOrganizationRepresentation[];
			receivedAt: Date;
		},
		void,
		unknown
	>,
): Promise<KeycloakOrganizationRepresentation[]> => {
	const organizations: KeycloakOrganizationRepresentation[] = [];
	for await (const { organizations: pageOrganizations } of pages) {
		organizations.push(...pageOrganizations);
	}
	return organizations;
};

describe('fetchKeycloakOrganizations', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	it('yields every organization from a single page that is smaller than the page size', async () => {
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, createOrganizationPage(0, 3));

		const organizations = await collectListedOrganizations(
			fetchKeycloakOrganizations(AUTHORIZATION_HEADER),
		);

		expect(organizations).toEqual(createOrganizationPage(0, 3));
	});

	it('yields nothing for a realm without organizations', async () => {
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, []);

		const organizations = await collectListedOrganizations(
			fetchKeycloakOrganizations(AUTHORIZATION_HEADER),
		);

		expect(organizations).toEqual([]);
	});

	it('lists paginated results across multiple pages', async () => {
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, createOrganizationPage(0, KEYCLOAK_RESOURCE_LIST_PAGE_SIZE));
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(
				200,
				createOrganizationPage(
					KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
					KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
				),
			);
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE * 2}`,
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(
				200,
				createOrganizationPage(KEYCLOAK_RESOURCE_LIST_PAGE_SIZE * 2, 17),
			);

		const organizations = await collectListedOrganizations(
			fetchKeycloakOrganizations(AUTHORIZATION_HEADER),
		);

		expect(organizations).toEqual(
			createOrganizationPage(0, KEYCLOAK_RESOURCE_LIST_PAGE_SIZE * 2 + 17),
		);
	});

	it('deduplicates an organization that repeats within and across pages', async () => {
		const repeatedOrganization = createKeycloakOrganizationRepresentation(
			KEYCLOAK_RESOURCE_LIST_PAGE_SIZE - 1,
		);
		const freshOrganization = createKeycloakOrganizationRepresentation(
			KEYCLOAK_RESOURCE_LIST_PAGE_SIZE,
		);
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, [
				repeatedOrganization,
				...createOrganizationPage(0, KEYCLOAK_RESOURCE_LIST_PAGE_SIZE - 2),
				repeatedOrganization,
			]);
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, [repeatedOrganization, freshOrganization]);

		const organizations = await collectListedOrganizations(
			fetchKeycloakOrganizations(AUTHORIZATION_HEADER),
		);

		expect(organizations).toEqual([
			repeatedOrganization,
			...createOrganizationPage(0, KEYCLOAK_RESOURCE_LIST_PAGE_SIZE - 2),
			freshOrganization,
		]);
	});

	it('rejects a malformed organization list from Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query(true)
			.reply(200, [{ id: 'this is not a uuid' }]);

		await expect(
			collectListedOrganizations(
				fetchKeycloakOrganizations(AUTHORIZATION_HEADER),
			),
		).rejects.toThrow(InternalValidationError);
	});

	it('propagates authorization failures from Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query(true)
			.reply(401, { error: 'HTTP 401 Unauthorized' });

		await expect(
			collectListedOrganizations(
				fetchKeycloakOrganizations(AUTHORIZATION_HEADER),
			),
		).rejects.toThrow(UnauthorizedError);
	});

	it('aborts when consecutive pages make no progress', async () => {
		const page = createOrganizationPage(0, KEYCLOAK_RESOURCE_LIST_PAGE_SIZE);
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, page);
		nock('https://keycloak.example.com')
			.get(ORGANIZATIONS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
				max: `${KEYCLOAK_RESOURCE_LIST_PAGE_SIZE}`,
			})
			.reply(200, page);

		await expect(
			collectListedOrganizations(
				fetchKeycloakOrganizations(AUTHORIZATION_HEADER),
			),
		).rejects.toThrow(InternalValidationError);
	});
});
