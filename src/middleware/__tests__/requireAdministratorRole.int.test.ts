import { requireAdministratorRole } from '../requireAdministratorRole';
import { UnauthorizedError } from '../../errors';
import { getTestUserKeycloakUserId } from '../../test/utils';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import type { AuthenticatedRequest, User } from '../../types';

const getMockedUser = (): User => ({
	keycloakUserId: getTestUserKeycloakUserId(),
	createdAt: '',
	permissions: {
		changemaker: {},
		dataProvider: {},
		funder: {},
		opportunity: {},
	},
});

describe('requireAuthentication', () => {
	it('calls next with an UnauthorizedError when no roles value is provided', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.user = getMockedUser();
		const nextMock = jest.fn((error) => {
			expect(error).toBeInstanceOf(UnauthorizedError);
			/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
			 * We have validated that error is an UnauthorizedError, but eslint doesn't recognize that fact.
			 */
			expect((error as UnauthorizedError).message).toEqual(
				'Your account must have the administrator role.',
			);
			done();
		});
		requireAdministratorRole(req, res, nextMock);
	});

	it('calls next with an UnauthorizedError when the user has an administrator role set to false', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.user = getMockedUser();
		req.role = {
			isAdministrator: false,
		};
		const nextMock = jest.fn((error) => {
			expect(error).toBeInstanceOf(UnauthorizedError);
			/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
			 * We have validated that error is an UnauthorizedError, but eslint doesn't recognize that fact.
			 */
			expect((error as UnauthorizedError).message).toEqual(
				'Your account must have the administrator role.',
			);
			done();
		});
		requireAdministratorRole(req, res, nextMock);
	});

	it('calls next when the user has an administrator role set to true', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.user = getMockedUser();
		req.role = {
			isAdministrator: true,
		};
		const nextMock = jest.fn((error) => {
			expect(error).toBe(undefined);
			done();
		});
		requireAdministratorRole(req, res, nextMock);
	});
});
