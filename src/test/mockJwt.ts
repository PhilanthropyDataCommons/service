import createJWKSMock from 'mock-jwks';
import { issuer } from '../auth/jwtOptions';
import { getTestUserAuthenticationId } from './utils';
import type { JWKSMock } from 'mock-jwks';

const getMockJwks = (): JWKSMock =>
	createJWKSMock(issuer, '/protocol/openid-connect/certs');

const mockJwks = getMockJwks();

const getMockJwt = (
	settings: {
		sub?: string;
		roles?: string[];
		iss?: string;
	} = {},
): { Authorization: string } => {
	const aMomentAgo = Math.round(new Date().getTime() / 1000);

	const token = mockJwks.token({
		exp: aMomentAgo + 1000000,
		iat: aMomentAgo,
		iss: settings.iss ?? issuer,
		sub: settings.sub,
		aud: 'account',
		typ: 'Bearer',
		azp: 'pdc-service',
		realm_access: {
			roles: settings.roles ?? ['default-roles-pdc'],
		},
	});
	return { Authorization: `Bearer ${token}` };
};

const mockJwt = getMockJwt({
	sub: getTestUserAuthenticationId(),
});

const mockJwtWithoutSub = getMockJwt();

const mockJwtWithAdminRole = getMockJwt({
	sub: getTestUserAuthenticationId(),
	roles: ['pdc-admin'],
});

export {
	mockJwks,
	mockJwt,
	mockJwtWithoutSub,
	mockJwtWithAdminRole,
	getMockJwt,
};
