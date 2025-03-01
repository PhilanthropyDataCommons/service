import createJWKSMock from 'mock-jwks';
import { issuer } from '../auth/jwtOptions';
import { keycloakIdToString } from '../types';
import { getTestUserKeycloakUserId } from './utils';
import type { JWKSMock } from 'mock-jwks';
import type { JwtPayload } from 'jsonwebtoken';

const getMockJwks = (jwksPath = '/protocol/openid-connect/certs'): JWKSMock =>
	createJWKSMock(issuer, jwksPath);

const mockJwks = getMockJwks();

const getMockJwt = (
	settings: {
		sub?: string;
		roles?: string[];
		iss?: string;
		organizations?: Record<string, string>;
	} = {},
	getToken: (payload: JwtPayload) => string = mockJwks.token,
): { Authorization: string } => {
	const aMomentAgo = Math.round(new Date().getTime() / 1000);

	const token = getToken({
		exp: aMomentAgo + 1000000,
		iat: aMomentAgo,
		iss: settings.iss ?? issuer,
		sub: settings.sub,
		aud: 'account',
		typ: 'Bearer',
		azp: 'pdc-service',
		organizations: settings.organizations ?? {
			fooOrganization: { id: '47d406ad-5e50-42d4-88f1-f87947a3e314' },
		},
		realm_access: {
			roles: settings.roles ?? ['default-roles-pdc'],
		},
	});
	return { Authorization: `Bearer ${token}` };
};

const mockJwt = getMockJwt({
	sub: keycloakIdToString(getTestUserKeycloakUserId()),
});

const mockJwtWithoutSub = getMockJwt();

const mockJwtWithAdminRole = getMockJwt({
	sub: keycloakIdToString(getTestUserKeycloakUserId()),
	roles: ['pdc-admin'],
});

export {
	mockJwks,
	mockJwt,
	mockJwtWithoutSub,
	mockJwtWithAdminRole,
	getMockJwt,
	getMockJwks,
};
