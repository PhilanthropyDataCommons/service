/* eslint-disable import/first */
// Jest hoists .mock() calls, so this needs to go before imports.
// See https://stackoverflow.com/a/67595592/159522
const customMiddleware = jest.fn();
import { requireEnv } from 'require-env-variable';
import { processJwt } from '../processJwt';
import {
	allowNextToResolve,
	generateNextWithAssertions,
} from '../../test/utils';
import {
	mockJwks,
	mockJwt as authHeader,
	getMockJwt,
	getMockJwks,
} from '../../test/mockJwt';
import type { NextFunction, Response } from 'express';
import type { Request as JWTRequest } from 'express-jwt';

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

	it('does NOT populate an auth value when an auth header with an invalid jwt server is used', (done) => {
		// This test is a little complicated -- we want to make sure that a JWT that looks exactly like a
		// correctly generated JWT, but is signed by a different cert, does not properly authenticate.
		// This covers the case where a third party generates a false JWT using a different private key.
		// To accomplish this with our mock jwt tooling we are going to need to create a temporary jwks
		// server, generate a cert, and then turn the original server back on.
		const badMockJwks = getMockJwks('/protocol/openid-connect/badCerts');
		mockJwks.stop();
		badMockJwks.start();
		const badJwt = getMockJwt({}, badMockJwks);
		badMockJwks.stop();
		mockJwks.start();

		const mockRequest = {
			headers: badJwt,
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const makeAssertions = async (err: unknown) => {
			expect(err).toBeInstanceOf(Error);
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

		expect(customMiddleware).toBeCalledTimes(1);
		expect(nextMock).toBeCalledTimes(1);
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
		expect(customMiddleware).toBeCalledTimes(1);
		expect(nextMock).toBeCalledTimes(1);
	});
});
