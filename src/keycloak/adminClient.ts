import { requireEnv } from 'require-env-variable';
import { HTTP_STATUS } from '../constants';
import {
	ForbiddenError,
	InternalValidationError,
	KeycloakAdminApiError,
	UnauthorizedError,
} from '../errors';
import { KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS } from './constants';

const { AUTH_SERVER_ISSUER } = requireEnv('AUTH_SERVER_ISSUER');

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

const KEYCLOAK_UNAUTHORIZED_STATUS: number =
	HTTP_STATUS.CLIENT_ERROR.UNAUTHORIZED;
const KEYCLOAK_FORBIDDEN_STATUS: number = HTTP_STATUS.CLIENT_ERROR.FORBIDDEN;

const fetchKeycloakResourceAsKeycloakAdmin = async (
	authorizationHeader: string,
	path: string,
	signal: AbortSignal = AbortSignal.timeout(KEYCLOAK_ADMIN_PAGE_TIMEOUT_IN_MS),
): Promise<{ response: Response; receivedAt: Date }> => {
	const response = await fetch(`${keycloakAdminApiBaseUrl}${path}`, {
		headers: { authorization: authorizationHeader },
		signal,
	}).catch((err: unknown) => {
		throw new KeycloakAdminApiError('Failed to reach the Keycloak Admin API.', {
			cause: err,
		});
	});
	const receivedAt = new Date();
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
		throw new KeycloakAdminApiError(
			`Keycloak Admin API request failed with ${response.status} ${response.statusText}.`,
		);
	}
	return { response, receivedAt };
};

export { getKeycloakAdminApiBaseUrl, fetchKeycloakResourceAsKeycloakAdmin };
