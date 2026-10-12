import { requireKeycloakRealmManagementRoles } from '../requireKeycloakRealmManagementRoles';
import { FailedMiddlewareError, ForbiddenError } from '../../errors';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import type { AuthenticatedRequest } from '../../types';

describe('requireKeycloakRealmManagementRoles', () => {
	it('throws a FailedMiddlewareError when configured with no required role sets', () => {
		// Regression: an empty variadic call would make `every([])` true and
		// admit every request. Treat the misconfiguration as a programming
		// error that surfaces as a 500, not a silent authorization bypass.
		expect(() => requireKeycloakRealmManagementRoles()).toThrow(
			FailedMiddlewareError,
		);
	});
	it('calls next with a ForbiddenError when the JWT carries no resource_access tree', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {};
		const nextMock = jest.fn((error) => {
			expect(error).toBeInstanceOf(ForbiddenError);
			done();
		});
		requireKeycloakRealmManagementRoles(['query-users', 'view-users'])(
			req,
			res,
			nextMock,
		);
	});

	it('calls next with a ForbiddenError when the JWT carries no realm-management roles', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			resource_access: {},
		};
		const nextMock = jest.fn((error) => {
			expect(error).toBeInstanceOf(ForbiddenError);
			done();
		});
		requireKeycloakRealmManagementRoles(['query-users', 'view-users'])(
			req,
			res,
			nextMock,
		);
	});

	it('calls next with a ForbiddenError when the JWT carries roles outside the accepted set', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			resource_access: {
				'realm-management': {
					roles: ['view-events'],
				},
			},
		};
		const nextMock = jest.fn((error) => {
			expect(error).toBeInstanceOf(ForbiddenError);
			done();
		});
		requireKeycloakRealmManagementRoles(['query-users', 'view-users'])(
			req,
			res,
			nextMock,
		);
	});

	it('calls next with a ForbiddenError when the JWT satisfies one required set but not another', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			resource_access: {
				'realm-management': {
					roles: ['query-users'],
				},
			},
		};
		const nextMock = jest.fn((error) => {
			expect(error).toBeInstanceOf(ForbiddenError);
			done();
		});
		requireKeycloakRealmManagementRoles(
			['query-users', 'view-users'],
			['manage-organizations'],
		)(req, res, nextMock);
	});

	it('calls next without an error when the JWT carries one accepted role in a required set', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			resource_access: {
				'realm-management': {
					roles: ['query-users'],
				},
			},
		};
		const nextMock = jest.fn((error) => {
			expect(error).toBe(undefined);
			done();
		});
		requireKeycloakRealmManagementRoles(['query-users', 'view-users'])(
			req,
			res,
			nextMock,
		);
	});

	it('calls next without an error when the JWT carries at least one accepted role in every required set', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			resource_access: {
				'realm-management': {
					roles: ['query-users', 'manage-organizations'],
				},
			},
		};
		const nextMock = jest.fn((error) => {
			expect(error).toBe(undefined);
			done();
		});
		requireKeycloakRealmManagementRoles(
			['query-users', 'view-users'],
			['manage-organizations'],
		)(req, res, nextMock);
	});
});
