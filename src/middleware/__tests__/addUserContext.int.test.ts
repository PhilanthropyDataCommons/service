import { addUserContext } from '../addUserContext';
import { loadUserByAuthenticationId, loadTableMetrics } from '../../database';
import { generateNextWithAssertions } from '../../test/utils';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types';

describe('requireAuthentication', () => {
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

	it('creates and assigns a user when an authenticationId is provided', (done) => {
		const mockRequest = {
			auth: {
				sub: 'foo@example.com',
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async (err: unknown) => {
					expect(err).toBe(undefined);
					const { count: userCount } = await loadTableMetrics('users');
					const user = await loadUserByAuthenticationId('foo@example.com');
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

	it('does not creates or assign a user when a blank authenticationId is provided', (done) => {
		const mockRequest = {
			auth: {
				sub: '',
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		loadTableMetrics('users')
			.then(({ count: baselineUserCount }) => {
				const runAssertions = async () => {
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

	it('does not creates or assign a user when no authenticationId is provided', (done) => {
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
