import nock from 'nock';
import { InternalValidationError, UnauthorizedError } from '../../errors';
import { listKeycloakUsers } from '../listUsers';

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
const PAGE_SIZE = 100;

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

describe('listKeycloakUsers', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	it('returns every user from a single page that is smaller than the page size', async () => {
		const request = nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${PAGE_SIZE}`,
			})
			.reply(200, createUserPage(0, 3));

		const users = await listKeycloakUsers(AUTHORIZATION_HEADER);

		expect(users).toEqual(createUserPage(0, 3));
		expect(request.isDone()).toBe(true);
	});

	it('returns an empty list for an empty realm', async () => {
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${PAGE_SIZE}`,
			})
			.reply(200, []);

		const users = await listKeycloakUsers(AUTHORIZATION_HEADER);

		expect(users).toEqual([]);
	});

	it('walks paginated results across multiple pages', async () => {
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${PAGE_SIZE}`,
			})
			.reply(200, createUserPage(0, PAGE_SIZE));
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${PAGE_SIZE}`,
				max: `${PAGE_SIZE}`,
			})
			.reply(200, createUserPage(PAGE_SIZE, PAGE_SIZE));
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${PAGE_SIZE * 2}`,
				max: `${PAGE_SIZE}`,
			})
			.reply(200, createUserPage(PAGE_SIZE * 2, 17));

		const users = await listKeycloakUsers(AUTHORIZATION_HEADER);

		expect(users).toEqual(createUserPage(0, PAGE_SIZE * 2 + 17));
	});

	it('rejects a malformed user list from Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query(true)
			.reply(200, [{ id: 'this is not a uuid' }]);

		await expect(listKeycloakUsers(AUTHORIZATION_HEADER)).rejects.toThrow(
			InternalValidationError,
		);
	});

	it('propagates authorization failures from Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query(true)
			.reply(401, { error: 'HTTP 401 Unauthorized' });

		await expect(listKeycloakUsers(AUTHORIZATION_HEADER)).rejects.toThrow(
			UnauthorizedError,
		);
	});

	it('aborts when consecutive pages make no progress', async () => {
		const page = createUserPage(0, PAGE_SIZE);
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: '0',
				max: `${PAGE_SIZE}`,
			})
			.reply(200, page);
		nock('https://keycloak.example.com')
			.get(USERS_PATH)
			.query({
				briefRepresentation: 'true',
				first: `${PAGE_SIZE}`,
				max: `${PAGE_SIZE}`,
			})
			.reply(200, page);

		await expect(listKeycloakUsers(AUTHORIZATION_HEADER)).rejects.toThrow(
			InternalValidationError,
		);
	});
});
