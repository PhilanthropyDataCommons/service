import { addUserContext } from '../addUserContext';
import { loadUserByAuthenticationId, loadTableMetrics } from '../../database';
import { generateNextWithAssertions } from '../../test/utils';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types';

describe('requireAuthentication', () => {
	it('does not creates or assign a user when auth is not provided', (done) => {
		const mockRequest = {} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			const metrics = await loadTableMetrics('users');
			expect(metrics.count).toEqual(0);
			expect(mockRequest.user).toBe(undefined);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addUserContext(mockRequest, mockResponse, nextMock);
	});

	it('creates and assigns a user when an authenticationId is provided', (done) => {
		const mockRequest = {
			auth: {
				sub: 'foo@example.com',
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		const runAssertions = async (err: unknown) => {
			expect(err).toBe(undefined);
			const user = await loadUserByAuthenticationId('foo@example.com');
			expect(mockRequest.user).toEqual(user);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addUserContext(mockRequest, mockResponse, nextMock);
	});

	it('does not creates or assign a user when a blank authenticationId is provided', (done) => {
		const mockRequest = {
			auth: {
				sub: '',
			},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		const runAssertions = async () => {
			const metrics = await loadTableMetrics('users');
			expect(metrics.count).toEqual(0);
			expect(mockRequest.user).toBe(undefined);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addUserContext(mockRequest, mockResponse, nextMock);
	});

	it('does not creates or assign a user when no authenticationId is provided', (done) => {
		const mockRequest = {
			auth: {},
		} as unknown as AuthenticatedRequest;
		const mockResponse = {} as unknown as Response;

		const runAssertions = async () => {
			const metrics = await loadTableMetrics('users');
			expect(metrics.count).toEqual(0);
			expect(mockRequest.user).toBe(undefined);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addUserContext(mockRequest, mockResponse, nextMock);
	});
});
