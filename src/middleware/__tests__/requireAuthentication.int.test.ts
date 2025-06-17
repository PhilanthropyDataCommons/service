import { requireAuthentication } from '../requireAuthentication';
import { UnauthorizedError } from '../../errors';
import { allowNextToResolve, loadTestUser } from '../../test/utils';
import type { NextFunction, Response } from 'express';
import type { Request as JWTRequest } from 'express-jwt';

describe('requireAuthentication', () => {
	it('calls next with an UnauthorizedError when no auth value is provided', async () => {
		const mockRequest = {} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock = jest.fn();
		requireAuthentication(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalled();
		// We know that the first `calls` is populated due to the passage of `.toHaveBeenCalled`
		/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'No authorization token was found.',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next with an UnauthorizedError when no auth sub is provided', async () => {
		const testUser = await loadTestUser();
		const mockRequest = {
			auth: {},
			user: testUser,
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock = jest.fn();
		requireAuthentication(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalled();
		// We know that the first `calls` is populated due to the passage of `.toHaveBeenCalled`
		/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'The authentication token must have a non-empty value for `auth.sub`.',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next with an UnauthorizedError when a blank auth sub is provided', async () => {
		const testUser = await loadTestUser();
		const mockRequest = {
			auth: {
				sub: '',
			},
			user: testUser,
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock = jest.fn();
		requireAuthentication(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalled();
		// We know that the first `calls` is populated due to the passage of `.toHaveBeenCalled`
		/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'The authentication token must have a non-empty value for `auth.sub`.',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next with an UnauthorizedError when there is no user provided', async () => {
		const mockRequest = {
			auth: {
				sub: 'test@example.com',
			},
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock = jest.fn();
		requireAuthentication(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalled();
		// We know that the first `calls` is populated due to the passage of `.toHaveBeenCalled`
		/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'The request lacks an AuthContext.',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next when when an auth value is provided', async () => {
		const testUser = await loadTestUser();
		const mockRequest = {
			auth: {
				sub: 'test@example.com',
			},
			role: {
				isAdministrator: false,
			},
			user: testUser,
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock: NextFunction = jest.fn();
		requireAuthentication(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalledWith();
	});
});
