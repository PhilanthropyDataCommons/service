// Jest hoists .mock() calls, so this needs to go before imports.
// See https://stackoverflow.com/a/67595592/159522
const customMiddleware = jest.fn();
import { requireEnv } from 'require-env-variable';
import jwt from 'jsonwebtoken';
import { processJwt } from '../processJwt';
import {
	allowNextToResolve,
	generateNextWithAssertions,
} from '../../test/utils';
import { mockJwt as authHeader, getMockJwt } from '../../test/mockJwt';
import type { NextFunction, Response } from 'express';
import type { Request as JWTRequest } from 'express-jwt';
import type { JwtPayload } from 'jsonwebtoken';

const { AUTH_SERVER_ISSUER } = requireEnv('AUTH_SERVER_ISSUER');

jest.mock('express-jwt', () => ({
	expressjwt: jest.fn(
		(...expressJwtArgs: unknown[]) =>
			async (...middlewareArgs: unknown[]) => {
				// This is complicated, but basically we want expressjwt to return a middleware generator that
				// will default to the actual middleware, BUT if a test has defined a mock implementation it
				// should use the mock middleware instead.
				if (customMiddleware.getMockImplementation() === undefined) {
					// It's not clear to me why jest isn't properly typing
					// these values, but this seems like a jest problem not an us problem.
					/* eslint-disable @typescript-eslint/no-unsafe-call */
					/* eslint-disable @typescript-eslint/no-unsafe-member-access */
					return jest
						.requireActual('express-jwt')
						.expressjwt(...expressJwtArgs)(...middlewareArgs) as unknown;
					/* eslint-enable @typescript-eslint/no-unsafe-member-access */
					/* eslint-enable @typescript-eslint/no-unsafe-call */
				}
				return customMiddleware(...middlewareArgs) as unknown;
			},
	),
}));

describe('processJwt', () => {
	it('does NOT populate an auth value when no auth header is sent', (done) => {
		const mockRequest = {} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const makeAssertions = async () => {
			expect(mockRequest.auth).toBe(undefined);
		};
		const nextMock = generateNextWithAssertions(makeAssertions, done);

		processJwt(mockRequest, mockResponse, nextMock);
	});

	it('does NOT populate an auth value when an auth header with an invalid issuer is sent', (done) => {
		const mockJwt = getMockJwt({
			iss: 'NotTheCorrectIssuer',
		});
		const mockRequest = {
			headers: mockJwt,
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const makeAssertions = async (err: unknown) => {
			expect(err).toBeInstanceOf(Error);
			expect(mockRequest.auth).toBe(undefined);
		};
		const nextMock = generateNextWithAssertions(makeAssertions, done);

		processJwt(mockRequest, mockResponse, nextMock);
	});

	it('does NOT populate an auth value when an auth header signed with an invalid key is used', (done) => {
		const badPrivateKey = `-----BEGIN PRIVATE KEY-----
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
+GfkC1U5a882gMp8nhMbzTQQ
-----END PRIVATE KEY-----`;

		const badJwt = getMockJwt({}, (payload: JwtPayload) =>
			jwt.sign(payload, badPrivateKey, { algorithm: 'RS256' }),
		);
		const mockRequest = {
			headers: badJwt,
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const makeAssertions = async (err: unknown) => {
			expect(err).toBeInstanceOf(Error);
			expect((err as Error).message).toBe('invalid signature');
			expect(mockRequest.auth).toBe(undefined);
		};
		const nextMock = generateNextWithAssertions(makeAssertions, done);

		processJwt(mockRequest, mockResponse, nextMock);
	});

	it('populates the request with an `auth` value when a valid auth header is sent', (done) => {
		const mockRequest = {
			headers: { ...authHeader },
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const makeAssertions = async () => {
			expect(mockRequest.auth).toMatchObject({
				exp: expect.any(Number) as number,
				iat: expect.any(Number) as number,
				iss: AUTH_SERVER_ISSUER,
				aud: 'account',
				typ: 'Bearer',
				azp: 'pdc-service',
				realm_access: { roles: ['default-roles-pdc'] },
			});
		};
		const nextMock = generateNextWithAssertions(makeAssertions, done);

		processJwt(mockRequest, mockResponse, nextMock);
	});

	it('does not call next twice if middleware throws an error after calling next', async () => {
		const mockRequest = {} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock: NextFunction = jest.fn();
		customMiddleware.mockReset();
		customMiddleware.mockImplementation(
			async (req: unknown, res: unknown, next: () => unknown) => {
				next();
				throw new Error('Something happened after calling next');
			},
		);

		processJwt(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();

		expect(customMiddleware).toHaveBeenCalledTimes(1);
		expect(nextMock).toHaveBeenCalledTimes(1);
	});

	it('calls next if middleware throws an error before calling next', async () => {
		const mockRequest = {} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock: NextFunction = jest.fn();
		customMiddleware.mockReset();
		customMiddleware.mockImplementation(async () => {
			throw new Error('Something happened before calling next');
		});

		processJwt(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();
		jest.unmock('express-jwt');

		expect(mockRequest.auth).toBe(undefined);
		expect(customMiddleware).toHaveBeenCalledTimes(1);
		expect(nextMock).toHaveBeenCalledTimes(1);
	});
});
