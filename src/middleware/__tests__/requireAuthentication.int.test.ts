import { requireAuthentication } from '../requireAuthentication';
import { UnauthorizedError } from '../../errors';
import {
	allowNextToResolve,
	getMockNextFunction,
	loadTestUser,
} from '../../test/utils';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import type { AuthenticatedRequest } from '../../types';

describe('requireAuthentication', () => {
	it('calls next with an UnauthorizedError when no auth value is provided', async () => {
		const req = getMockRequest();
		const res = getMockResponse();
		const nextMock = getMockNextFunction();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'No authorization token was found.',
			}),
		);
		expect(nextMock.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
	});

	it('calls next with an UnauthorizedError when no auth sub is provided', async () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {};
		req.user = await loadTestUser();
		const nextMock = getMockNextFunction();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalledWith(
			expect.objectContaining({
				message:
					'The authentication token must have a non-empty value for `auth.sub`.',
			}),
		);
		expect(nextMock.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
	});

	it('calls next with an UnauthorizedError when a blank auth sub is provided', async () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: '',
		};
		req.user = await loadTestUser();
		const nextMock = getMockNextFunction();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalledWith(
			expect.objectContaining({
				message:
					'The authentication token must have a non-empty value for `auth.sub`.',
			}),
		);
		expect(nextMock.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
	});

	it('calls next with an UnauthorizedError when there is no user provided', async () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: 'test@example.com',
			name: 'Norbert',
		};
		const nextMock = getMockNextFunction();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'The request lacks an AuthContext.',
			}),
		);
		expect(nextMock.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
	});

	it('calls next when an auth value is provided', async () => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			sub: 'test2@example.com',
			name: 'Peter',
		};
		req.role = {
			isAdministrator: false,
		};
		req.user = await loadTestUser();
		const nextMock = getMockNextFunction();
		requireAuthentication(req, res, nextMock);
		await allowNextToResolve();

		expect(nextMock).toHaveBeenCalledWith();
	});
});
