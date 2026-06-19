import { requireFunderPermission } from '../requireFunderPermission';
import {
	ForbiddenError,
	InputValidationError,
	NotFoundError,
	UnauthorizedError,
} from '../../errors';
import {
	getDatabase,
	createPermissionGrant,
	loadSystemUser,
} from '../../database';
import { getAuthContext, getMockedUser, loadTestUser } from '../../test/utils';
import { createTestFunder } from '../../test/factories';
import { getMockRequest, getMockResponse } from '../../test/mockExpress';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../../types';
import type { AuthenticatedRequest } from '../../types';

describe('requireFunderPermission', () => {
	it('calls next with an UnauthorizedError when request lacks AuthContext', (done) => {
		const req = getMockRequest();
		const res = getMockResponse();
		const nextMock = jest.fn((error: unknown) => {
			expect(error).toBeInstanceOf(UnauthorizedError);
			expect(error).toMatchObject({
				message: 'The request lacks an AuthContext.',
			});
			done();
		});

		void requireFunderPermission(PermissionGrantVerb.VIEW)(req, res, nextMock);
	});

	it('calls next without error when user is an administrator', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.user = getMockedUser();
		req.role = { isAdministrator: true };
		req.params = { funderShortCode: 'test_funder' };
		const nextMock = jest.fn((error: unknown) => {
			expect(error).toBe(undefined);
			done();
		});

		void requireFunderPermission(PermissionGrantVerb.VIEW)(req, res, nextMock);
	});

	it('calls next with an InputValidationError when funderShortCode is invalid', (done) => {
		const req = getMockRequest() as AuthenticatedRequest;
		const res = getMockResponse();
		req.user = getMockedUser();
		req.role = { isAdministrator: false };
		req.params = { funderShortCode: 'invalid short code with spaces' };
		const nextMock = jest.fn((error: unknown) => {
			expect(error).toBeInstanceOf(InputValidationError);
			expect(error).toMatchObject({
				message: 'Invalid funderShortCode.',
			});
			done();
		});

		void requireFunderPermission(PermissionGrantVerb.VIEW)(req, res, nextMock);
	});

	it('calls next with a ForbiddenError when user lacks permission but can view the funder', (done) => {
		void (async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const unpermittedFunder = await createTestFunder(db, testUserAuthContext);

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { funderShortCode: unpermittedFunder.shortCode };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(ForbiddenError);
				expect(error).toMatchObject({
					message:
						'Authenticated user does not have permission to perform this action.',
				});
				done();
			});

			void requireFunderPermission(PermissionGrantVerb.EDIT)(
				req,
				res,
				nextMock,
			);
		})();
	});

	it('calls next with a NotFoundError when the funder does not exist', (done) => {
		void (async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { funderShortCode: 'nonexistentfunder' };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(NotFoundError);
				done();
			});

			void requireFunderPermission(PermissionGrantVerb.EDIT)(
				req,
				res,
				nextMock,
			);
		})();
	});

	it('calls next without error when user has the required permission', (done) => {
		void (async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const permittedFunder = await createTestFunder(db, testUserAuthContext);

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: permittedFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { funderShortCode: permittedFunder.shortCode };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBe(undefined);
				done();
			});

			void requireFunderPermission(PermissionGrantVerb.EDIT)(
				req,
				res,
				nextMock,
			);
		})();
	});

	it('calls next with a ForbiddenError when user has a different permission than required', (done) => {
		void (async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const viewOnlyFunder = await createTestFunder(db, testUserAuthContext);

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: viewOnlyFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { funderShortCode: viewOnlyFunder.shortCode };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(ForbiddenError);
				expect(error).toMatchObject({
					message:
						'Authenticated user does not have permission to perform this action.',
				});
				done();
			});

			void requireFunderPermission(PermissionGrantVerb.EDIT)(
				req,
				res,
				nextMock,
			);
		})();
	});
});
