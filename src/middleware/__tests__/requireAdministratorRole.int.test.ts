import { requireAdministratorRole } from '../requireAdministratorRole';
import { UnauthorizedError } from '../../errors';
import type { Response } from 'express';
import type { Request as JWTRequest } from 'express-jwt';
import type { User } from '../../types';

const getMockedUser = (): User => ({
	id: 1,
	authenticationId: 'foo@example.com',
	createdAt: '',
});

describe('requireAuthentication', () => {
	it('calls next with an UnauthorizedError when no roles value is provided', (done) => {
		const mockRequest = {
			user: getMockedUser(),
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock = jest.fn((error) => {
			expect(error).toBeInstanceOf(UnauthorizedError);
			expect((error as UnauthorizedError).message).toEqual(
				'Your account must have the administrator role.',
			);
			done();
		});
		requireAdministratorRole(mockRequest, mockResponse, nextMock);
	});

	it('calls next with an UnauthorizedError when the user has an administrator role set to false', (done) => {
		const mockRequest = {
			user: getMockedUser(),
			role: {
				isAdministrator: false,
			},
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock = jest.fn((error) => {
			expect(error).toBeInstanceOf(UnauthorizedError);
			expect((error as UnauthorizedError).message).toEqual(
				'Your account must have the administrator role.',
			);
			done();
		});
		requireAdministratorRole(mockRequest, mockResponse, nextMock);
	});

	it('calls next when the user has an administrator role set to true', (done) => {
		const mockRequest = {
			user: getMockedUser(),
			role: {
				isAdministrator: true,
			},
		} as unknown as JWTRequest;
		const mockResponse = {} as unknown as Response;
		const nextMock = jest.fn((error) => {
			expect(error).toBe(undefined);
			done();
		});
		requireAdministratorRole(mockRequest, mockResponse, nextMock);
	});
});
