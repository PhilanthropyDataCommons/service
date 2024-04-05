import { requireAuthentication } from '../requireAuthentication';
import { UnauthorizedError } from '../../errors';
import { allowNextToResolve } from '../../test/utils';
import type { NextFunction, Response } from 'express';
import type { Request as JWTRequest } from 'express-jwt';

describe('requireAuthentication', () => {
	it('calls next with an UnauthorizedError when no auth value is provided', async () => {
		const mockRequest = {} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock = jest.fn();
		requireAuthentication(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();

		expect(nextMock).toBeCalled();
		// We know that the first `calls` is populated due to the passage of `.toBeCalled`
		/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'No authorization token was found',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next when when an auth value is provided', async () => {
		const mockRequest = {
			auth: {},
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock: NextFunction = jest.fn();
		requireAuthentication(mockRequest, mockResponse, nextMock);
		await allowNextToResolve();

		expect(nextMock).toBeCalledWith();
	});
});
