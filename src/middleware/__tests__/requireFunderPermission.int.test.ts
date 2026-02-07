import { requireFunderPermission } from '../requireFunderPermission';
import { InputValidationError, UnauthorizedError } from '../../errors';
import {
	db,
	createOrUpdateFunder,
	createPermissionGrant,
	loadSystemUser,
} from '../../database';
import { getAuthContext, getMockedUser, loadTestUser } from '../../test/utils';
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

	it('calls next with an UnauthorizedError when user lacks permission', (done) => {
		void (async () => {
			const testUser = await loadTestUser();
			await createOrUpdateFunder(db, null, {
				shortCode: 'test_funder_no_perm',
				name: 'Test Funder No Permission',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { funderShortCode: 'test_funder_no_perm' };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(UnauthorizedError);
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

	it('calls next without error when user has the required permission', (done) => {
		void (async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'test_funder_with_perm',
				name: 'Permitted Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { funderShortCode: funder.shortCode };
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

	it('calls next with an UnauthorizedError when user has a different permission than required', (done) => {
		void (async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'test_funder_view_only',
				name: 'View Only Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const req = getMockRequest() as AuthenticatedRequest;
			const res = getMockResponse();
			req.user = testUser;
			req.role = { isAdministrator: false };
			req.params = { funderShortCode: funder.shortCode };
			const nextMock = jest.fn((error: unknown) => {
				expect(error).toBeInstanceOf(UnauthorizedError);
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
