import { requireEnv } from 'require-env-variable';
import { HTTP_STATUS } from '../constants';
import {
	ForbiddenError,
	InternalValidationError,
	UnauthorizedError,
} from '../errors';

const { AUTH_SERVER_ISSUER } = requireEnv('AUTH_SERVER_ISSUER');

/**
 * Derives the Keycloak Admin REST API base URL from a Keycloak realm issuer
 * URL. `AUTH_SERVER_ISSUER` points at a realm (e.g.
 * `https://auth.example.com/realms/pdc`); the Admin REST API for that realm
 * lives at `<issuer without the realm>/admin/realms/<realm>` (e.g.
 * `https://auth.example.com/admin/realms/pdc`). A path prefix on the issuer
 * (e.g. `https://auth.example.com/auth/realms/pdc`) is preserved.
 */
const getKeycloakAdminApiBaseUrl = (issuerUrl: string): string => {
	const issuerUrlPattern =
		/^(?<prefix>https?:\/\/.+)\/realms\/(?<realm>[^\/]+)\/?$/v;
	const match = issuerUrlPattern.exec(issuerUrl);
	if (match?.groups === undefined) {
		throw new InternalValidationError(
			`Could not derive a Keycloak Admin REST API base URL from "${issuerUrl}"; the configured issuer is expected to look like <issuer>/realms/<realm>.`,
			[],
		);
	}
	const { prefix, realm }: Record<string, string | undefined> = match.groups;
	if (prefix === undefined || realm === undefined) {
		throw new InternalValidationError(
			`Could not derive a Keycloak Admin REST API base URL from "${issuerUrl}"; the configured issuer is expected to look like <issuer>/realms/<realm>.`,
			[],
		);
	}
	return `${prefix}/admin/realms/${realm}`;
};

const keycloakAdminApiBaseUrl = getKeycloakAdminApiBaseUrl(AUTH_SERVER_ISSUER);

// response.status is a plain number; comparing it directly against enum
// members is flagged as an unsafe enum comparison, so stage the enum values
// into number-typed constants first.
const KEYCLOAK_UNAUTHORIZED_STATUS: number =
	HTTP_STATUS.CLIENT_ERROR.UNAUTHORIZED;
const KEYCLOAK_FORBIDDEN_STATUS: number = HTTP_STATUS.CLIENT_ERROR.FORBIDDEN;

/**
 * Performs a request against the Keycloak Admin REST API using the
 * authorization header of the caller that initiated the work (credential
 * passthrough; the service never holds a Keycloak credential of its own).
 */
const keycloakAdminFetch = async (
	authorizationHeader: string,
	path: string,
): Promise<Response> => {
	const response = await fetch(`${keycloakAdminApiBaseUrl}${path}`, {
		headers: { authorization: authorizationHeader },
	}).catch((err: unknown) => {
		throw new Error('Failed to reach the Keycloak Admin API.', {
			cause: err,
		});
	});
	if (response.status === KEYCLOAK_UNAUTHORIZED_STATUS) {
		throw new UnauthorizedError(
			'Keycloak rejected the credentials used to call the Admin API.',
		);
	}
	if (response.status === KEYCLOAK_FORBIDDEN_STATUS) {
		throw new ForbiddenError(
			'Keycloak rejected the Admin API request; the credentials lack the required realm-management roles.',
		);
	}
	if (!response.ok) {
		throw new Error(
			`Keycloak Admin API request failed with ${response.status} ${response.statusText}.`,
		);
	}
	return response;
};

export { getKeycloakAdminApiBaseUrl, keycloakAdminFetch };
