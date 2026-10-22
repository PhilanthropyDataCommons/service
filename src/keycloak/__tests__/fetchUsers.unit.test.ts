import { PassThrough } from 'node:stream';
import nock from 'nock';
import {
	InternalValidationError,
	KeycloakAdminApiError,
	UnauthorizedError,
} from '../../errors';
import { fetchKeycloakUsers } from '../fetchUsers';
import { KEYCLOAK_USERS_LIST_PAGE_SIZE } from '../constants';

// listUsers loads the admin client, which reads AUTH_SERVER_ISSUER itself via
// requireEnv; provide it here so the module under test can load without
// environment setup.
jest.mock('require-env-variable', () => ({
	requireEnv: () => ({
		AUTH_SERVER_ISSUER: 'https://keycloak.example.com/realms/test-realm',
	}),
}));

const AUTHORIZATION_HEADER = 'Bearer some.test.jwt';
const USERS_PATH = '/admin/realms/test-realm/users';
const createKeycloakUserRepresentation = (index: number) => ({
	id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
	firstName: `First${index}`,
	lastName: `Last${index}`,
	enabled: true,
});

const createUserPage = (offset: number, count: number) =>
	Array.from({ length: count }, (_unused, index) =>
		createKeycloakUserRepresentation(offset + index),
	);

describe('fetchKeycloakUsers', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	it('rejects with a KeycloakAdminApiError when the response body is malformed JSON', async () => {
		const request = nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: '0',
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(200, '<html>not json</html>');

		await expect(fetchKeycloakUsers(AUTHORIZATION_HEADER)).rejects.toThrow(
			KeycloakAdminApiError,
		);
		expect(request.isDone()).toBe(true);
	});

	it('rejects with a KeycloakAdminApiError when the response body transfer is interrupted', async () => {
		const request = nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: '0',
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(200, () => {
				const body = new PassThrough();
				setTimeout(() => {
					// undici rejects interrupted body transfers with
					// `TypeError: terminated`; simulate that failure.
					body.destroy(new TypeError('terminated'));
				}, 5);
				return body;
			});

		await expect(fetchKeycloakUsers(AUTHORIZATION_HEADER)).rejects.toThrow(
			KeycloakAdminApiError,
		);
		expect(request.isDone()).toBe(true);
	});

	it('rejects with a KeycloakAdminApiError when the listing exceeds its deadline', async () => {
		const request = nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: '0',
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.delay(2000)
			.reply(200, createUserPage(0, 3));

		await expect(
			fetchKeycloakUsers(AUTHORIZATION_HEADER, AbortSignal.timeout(500)),
		).rejects.toThrow(KeycloakAdminApiError);
		expect(request.isDone()).toBe(true);
	});

	it('returns every user from a single page that is smaller than the page size', async () => {
		const request = nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: '0',
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(200, createUserPage(0, 3));

		const users = await fetchKeycloakUsers(AUTHORIZATION_HEADER);

		expect(users).toEqual(createUserPage(0, 3));
		expect(request.isDone()).toBe(true);
	});

	it('returns an empty list for an empty realm', async () => {
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: '0',
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(200, []);

		const users = await fetchKeycloakUsers(AUTHORIZATION_HEADER);

		expect(users).toEqual([]);
	});

	it('lists paginated results across multiple pages', async () => {
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: '0',
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(200, createUserPage(0, KEYCLOAK_USERS_LIST_PAGE_SIZE));
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(
				200,
				createUserPage(
					KEYCLOAK_USERS_LIST_PAGE_SIZE,
					KEYCLOAK_USERS_LIST_PAGE_SIZE,
				),
			);
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: `${KEYCLOAK_USERS_LIST_PAGE_SIZE * 2}`,
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(200, createUserPage(KEYCLOAK_USERS_LIST_PAGE_SIZE * 2, 17));

		const users = await fetchKeycloakUsers(AUTHORIZATION_HEADER);

		expect(users).toEqual(
			createUserPage(0, KEYCLOAK_USERS_LIST_PAGE_SIZE * 2 + 17),
		);
	});

	it('rejects a malformed user list from Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query(true)
			.reply(200, [{ id: 'this is not a uuid' }]);

		await expect(fetchKeycloakUsers(AUTHORIZATION_HEADER)).rejects.toThrow(
			InternalValidationError,
		);
	});

	it('propagates authorization failures from Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query(true)
			.reply(401, { error: 'HTTP 401 Unauthorized' });

		await expect(fetchKeycloakUsers(AUTHORIZATION_HEADER)).rejects.toThrow(
			UnauthorizedError,
		);
	});

	it('aborts when consecutive pages make no progress', async () => {
		const page = createUserPage(0, KEYCLOAK_USERS_LIST_PAGE_SIZE);
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: '0',
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(200, page);
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
				max: `${KEYCLOAK_USERS_LIST_PAGE_SIZE}`,
			})
			.reply(200, page);

		await expect(fetchKeycloakUsers(AUTHORIZATION_HEADER)).rejects.toThrow(
			InternalValidationError,
		);
	});
});
