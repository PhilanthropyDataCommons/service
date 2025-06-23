import { requireAuthentication } from '../requireAuthentication';
import { UnauthorizedError } from '../../errors';
import { allowNextToResolve, loadTestUser } from '../../test/utils';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import type { NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types';

describe('requireAuthentication', () => {
	it('calls next with an UnauthorizedError when no auth value is provided', async () => {
		const req = getMockRequest();
		const res = getMockResponse();
		const nextMock = jest.fn();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalled();
		/* eslint-disable @typescript-eslint/no-unsafe-member-access --
		 * We know that the first `calls` is populated due to the passage of `.toHaveBeenCalled`
		 */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'No authorization token was found.',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next with an UnauthorizedError when no auth sub is provided', async () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {};
		req.user = await loadTestUser();
		const nextMock = jest.fn();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalled();
		/* eslint-disable @typescript-eslint/no-unsafe-member-access --
		 * We know that the first `calls` is populated due to the passage of `.toHaveBeenCalled`
		 */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'The authentication token must have a non-empty value for `auth.sub`.',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next with an UnauthorizedError when a blank auth sub is provided', async () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: '',
		};
		req.user = await loadTestUser();
		const nextMock = jest.fn();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalled();
		/* eslint-disable @typescript-eslint/no-unsafe-member-access --
		 * We know that the first `calls` is populated due to the passage of `.toHaveBeenCalled`
		 */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'The authentication token must have a non-empty value for `auth.sub`.',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next with an UnauthorizedError when there is no user provided', async () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: 'test@example.com',
		};
		const nextMock = jest.fn();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalled();
		/* eslint-disable @typescript-eslint/no-unsafe-member-access --
		 * We know that the first `calls` is populated due to the passage of `.toHaveBeenCalled`
		 */
		expect(nextMock.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(nextMock.mock.calls[0][0].message).toEqual(
			'The request lacks an AuthContext.',
		);
		/* eslint-enable @typescript-eslint/no-unsafe-member-access */
	});

	it('calls next when when an auth value is provided', async () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: 'test@example.com',
		};
		req.role = {
			isAdministrator: false,
		};
		req.user = await loadTestUser();
		const nextMock: NextFunction = jest.fn();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalledWith();
	});
});
