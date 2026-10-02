import { addRoleContext } from '../addRoleContext';
import { generateNextWithAssertions } from '../../test/utils';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import type { AuthenticatedRequest } from '../../types';

describe('addRoleContext', () => {
	it('Assigns the administrator role if pdc-admin is in the auth roles', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['pdc-admin'],
			},
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.isAdministrator).toBe(true);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});

	it('Does NOT assign the administrator role if pdc-admin is not the auth roles', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['not-pdc-admin'],
			},
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.isAdministrator).toBe(false);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});

	it('sets canViewAllUsers false when the JWT carries no resource_access tree', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['pdc-admin'],
			},
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.canViewAllUsers).toBe(false);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});

	it('sets canViewAllUsers false when the JWT carries realm-management roles outside the accepted set', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['pdc-admin'],
			},
			resource_access: {
				'realm-management': {
					roles: ['view-events'],
				},
			},
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.canViewAllUsers).toBe(false);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});

	it('sets canViewAllUsers true when the JWT carries query-users', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['default-roles-pdc'],
			},
			resource_access: {
				'realm-management': {
					roles: ['query-users'],
				},
			},
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.canViewAllUsers).toBe(true);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});

	it('sets canViewAllUsers true when the JWT carries view-users', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['default-roles-pdc'],
			},
			resource_access: {
				'realm-management': {
					roles: ['view-users'],
				},
			},
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.canViewAllUsers).toBe(true);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});

	it('sets canViewAllUsers true when the JWT carries manage-users', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.auth = {
			realm_access: {
				roles: ['default-roles-pdc'],
			},
			resource_access: {
				'realm-management': {
					roles: ['manage-users'],
				},
			},
		};

		const runAssertions = (err: unknown) => {
			expect(err).toBe(undefined);
			expect(req.role?.canViewAllUsers).toBe(true);
		};

		const nextMock = generateNextWithAssertions(runAssertions, done);
		addRoleContext(req, res, nextMock);
	});
});
