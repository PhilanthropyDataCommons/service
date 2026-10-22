import nock from 'nock';
import {
	ForbiddenError,
	InternalValidationError,
	UnauthorizedError,
} from '../../errors';
import { KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS } from '../../keycloak/constants';
import { getKeycloakAdminApiBaseUrl, keycloakAdminFetch } from '../adminClient';

// The admin client reads AUTH_SERVER_ISSUER itself via requireEnv; provide it
// here so the module under test can load without environment setup.
jest.mock('require-env-variable', () => ({
	requireEnv: () => ({
		AUTH_SERVER_ISSUER: 'https://keycloak.example.com/realms/test-realm',
	}),
}));

const AUTHORIZATION_HEADER = 'Bearer some.test.jwt';

describe('getKeycloakAdminApiBaseUrl', () => {
	it('derives the admin API base URL from a realm issuer URL', () => {
		expect(
			getKeycloakAdminApiBaseUrl('https://auth.example.com/realms/pdc'),
		).toBe('https://auth.example.com/admin/realms/pdc');
	});

	it('tolerates a trailing slash on the issuer URL', () => {
		expect(
			getKeycloakAdminApiBaseUrl('https://auth.example.com/realms/pdc/'),
		).toBe('https://auth.example.com/admin/realms/pdc');
	});

	it('preserves a path prefix on the issuer URL', () => {
		expect(
			getKeycloakAdminApiBaseUrl('https://auth.example.com/auth/realms/pdc'),
		).toBe('https://auth.example.com/auth/admin/realms/pdc');
	});

	it('rejects issuer URLs that do not point at a realm', () => {
		expect(() =>
			getKeycloakAdminApiBaseUrl('https://auth.example.com/not-a-realm'),
		).toThrow(InternalValidationError);
	});
});

describe('keycloakAdminFetch', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	it('passes the provided authorization header through to Keycloak', async () => {
		const request = nock('https://keycloak.example.com')
			.get('/admin/realms/test-realm/users/count')
			.matchHeader('authorization', AUTHORIZATION_HEADER)
			.reply(200, { count: 3 });

		const response = await keycloakAdminFetch(
			AUTHORIZATION_HEADER,
			'/users/count',
		);

		expect(response.ok).toBe(true);
		expect(request.isDone()).toBe(true);
	});

	it('passes an abort signal to the fetch call', async () => {
		const signal = AbortSignal.timeout(KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS);
		const fetchSpy = jest
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response('{}', { status: 200 }));

		await keycloakAdminFetch(AUTHORIZATION_HEADER, '/users/count', signal);

		expect(fetchSpy).toHaveBeenCalledWith(
			'https://keycloak.example.com/admin/realms/test-realm/users/count',
			expect.objectContaining({ signal }),
		);
		fetchSpy.mockRestore();
	});

	it('throws an UnauthorizedError when Keycloak rejects the credentials', async () => {
		nock('https://keycloak.example.com')
			.get('/admin/realms/test-realm/users/count')
			.reply(401, { error: 'HTTP 401 Unauthorized' });

		await expect(
			keycloakAdminFetch(AUTHORIZATION_HEADER, '/users/count'),
		).rejects.toThrow(UnauthorizedError);
	});

	it('throws a ForbiddenError when Keycloak rejects the request with 403', async () => {
		nock('https://keycloak.example.com')
			.get('/admin/realms/test-realm/users/count')
			.reply(403, { error: 'error' });

		await expect(
			keycloakAdminFetch(AUTHORIZATION_HEADER, '/users/count'),
		).rejects.toThrow(ForbiddenError);
	});

	it('throws an error wrapping unexpected Keycloak failures', async () => {
		nock('https://keycloak.example.com')
			.get('/admin/realms/test-realm/users/count')
			.reply(503, { error: 'unavailable' });

		await expect(
			keycloakAdminFetch(AUTHORIZATION_HEADER, '/users/count'),
		).rejects.toThrow(/503/v);
	});

	it('wraps network-level failures reaching Keycloak', async () => {
		nock('https://keycloak.example.com')
			.get('/admin/realms/test-realm/users/count')
			.replyWithError('connection refused');

		await expect(
			keycloakAdminFetch(AUTHORIZATION_HEADER, '/users/count'),
		).rejects.toThrow('Failed to reach the Keycloak Admin API.');
	});
});
