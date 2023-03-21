import createJWKSMock from 'mock-jwks';
import { issuer } from '../auth/jwtOptions';
import type { JWKSMock } from 'mock-jwks';

const getMockJwks = (): JWKSMock => createJWKSMock(
  issuer,
  '/protocol/openid-connect/certs',
);

const getMockJwt = (jwksMock: JWKSMock): string => {
  const aMomentAgo = Math.round(new Date().getTime() / 1000);
  return jwksMock.token({
    exp: aMomentAgo + 1000000,
    iat: aMomentAgo,
    iss: issuer,
    aud: 'account',
    typ: 'Bearer',
    azp: 'pdc-service',
    realm_access: {
      roles: [
        'default-roles-pdc',
      ],
    },
  });
};

export const mockJwks = getMockJwks();
export const mockJwt = { Authorization: `Bearer ${getMockJwt(mockJwks)}` };
