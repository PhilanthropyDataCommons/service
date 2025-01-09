import { addUserContext } from '../addUserContext';
import { loadUserByKeycloakUserId, loadTableMetrics } from '../../database';
import { generateNextWithAssertions } from '../../test/utils';
import { stringToKeycloakId } from '../../types';
import { InputValidationError } from '../../errors';
import type { AuthenticatedRequest } from '../../types';
import type { Response } from 'express';

describe('addUserContext', () => {
	it('does not creates or assign a user when auth is not provided', (done) => {
		const mockRequest = {} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: userCount } = await loadTableMetrics('users');
					expect(userCount).toEqual(baselineUserCount);
					expect(mockRequest.user).toBe(undefined);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});

	it('creates and assigns a user when a keycloakUserId is provided', (done) => {
		const mockRequest = {
			auth: {
				sub: '123e4567-e89b-12d3-a456-426614174000',
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: userCount } = await loadTableMetrics('users');
					const user = await loadUserByKeycloakUserId(
						null,
						stringToKeycloakId('123e4567-e89b-12d3-a456-426614174000'),
					);
					expect(mockRequest.user).toEqual(user);
					expect(userCount).toEqual(baselineUserCount + 1);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});

	it('passes an error and does not creates or assign a user when an invalid keycloakUserId is provided', (done) => {
		const mockRequest = {
			auth: {
				sub: 'this is not a UUID',
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					const { count: userCount } = await loadTableMetrics('users');
					expect(userCount).toEqual(baselineUserCount);
					expect(mockRequest.user).toBe(undefined);
					expect(err).toBeInstanceOf(InputValidationError);
					expect((err as InputValidationError).message).toEqual(
						'auth subject must be a valid keycloak user id',
					);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});

	it('does not creates or assign a user when no keycloakUserId is provided', (done) => {
		const mockRequest = {
			auth: {},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async () => {
					const metrics = await loadTableMetrics('users');
					expect(metrics.count).toEqual(baselineUserCount);
					expect(mockRequest.user).toBe(undefined);
				};

				const nextMock = generateNextWithAssertions(runAssertions, done);
				addUserContext(mockRequest, mockResponse, nextMock);
			})
			.catch((e) => {
				done(e);
			});
	});
});
