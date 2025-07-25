import createJWKSMock from 'mock-jwks';
import { issuer } from '../auth/jwtOptions';
import { nonNullKeycloakIdToString } from '../types';
import { MS_PER_SECOND } from '../constants';
import { getTestUserKeycloakUserId } from './utils';
import type { JWKSMock } from 'mock-jwks';
import type { JwtPayload } from 'jsonwebtoken';

const getMockJwks = (jwksPath = '/protocol/openid-connect/certs'): JWKSMock =>
	createJWKSMock(issuer, jwksPath);

const mockJwks = getMockJwks();

const AN_ARBITRARILY_LONG_TIME = 1000000;
const mockOrgId = '47d406ad-5e50-42d4-88f1-f87947a3e314';

const getMockJwt = (
	settings: {
		sub?: string;
		roles?: string[];
		iss?: string;
		organizations?: Record<string, string>;
	} = {},
	getToken: (payload: JwtPayload) => string = mockJwks.token,
): { Authorization: string } => {
	const aMomentAgo = Math.round(new Date().getTime() / MS_PER_SECOND);

	const token = getToken({
		exp: aMomentAgo + AN_ARBITRARILY_LONG_TIME,
		iat: aMomentAgo,
		iss: settings.iss ?? issuer,
		sub: settings.sub,
		aud: 'account',
		typ: 'Bearer',
		azp: 'pdc-service',
		organizations: settings.organizations ?? {
			fooOrganization: { id: mockOrgId },
		},
		realm_access: {
			roles: settings.roles ?? ['default-roles-pdc'],
		},
	});
	return { Authorization: `Bearer ${token}` };
};

const mockJwt = getMockJwt({
	sub: nonNullKeycloakIdToString(getTestUserKeycloakUserId()),
});

const mockJwtWithoutSub = getMockJwt();

const mockJwtWithAdminRole = getMockJwt({
	sub: nonNullKeycloakIdToString(getTestUserKeycloakUserId()),
	roles: ['pdc-admin'],
});

export {
	mockJwks,
	mockJwt,
	mockJwtWithoutSub,
	mockJwtWithAdminRole,
	mockOrgId,
	getMockJwt,
	getMockJwks,
};
